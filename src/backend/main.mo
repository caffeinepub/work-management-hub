import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import UserApproval "user-approval/approval";
import Random "mo:core/Random";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";



actor {
  public type Role = {
    #superadmin;
    #admin;
    #finance;
    #concierge;
    #strategicPartner;
    #asistenmu;
    #client;
    #partner;
  };

  public type Status = {
    #pending;
    #active;
    #rejected;
  };

  public type User = {
    principalId : Principal;
    name : Text;
    role : Role;
    status : Status;
    createdAt : Int;
    kotaDomisili : ?Text;
    companyBisnis : ?Text;
    idUser : Text;
    phoneNumber : ?Text;
    email : ?Text;
  };

  public type UserProfile = {
    name : Text;
    requestedRole : ?Text;
    phoneNumber : ?Text;
    email : ?Text;
  };

  public type Layanan = {
    id : Text;
    nama : Text;
    scopeKerja : Text;
    clientId : Principal;
    saldoJamEfektif : Nat;
    saldoOriginal : Nat;
    harga : Nat;
    status : {
      #active;
      #pendingApproval;
      #depleted;
      #dormant;
    };
    createdAt : Int;
    deadline : Int;
    adminId : Principal;
    layananType : {
      #reportWriting;
      #assistance;
      #dataEntry;
    };
    resourceType : {
      #standard;
      #dedicated;
    };
    jamOnHold : Nat;
  };

  public type ClientLayanan = {
    id : Text;
    nama : Text;
    saldo : Nat;
  };

  public type LayananClientView = {
    id : Text;
    nama : Text;
    unitAktif : Nat;
    unitOnHold : Nat;
    saldo : Nat;
    jumlahSharing : Nat;
    harga : Nat;
    namaAsistenmu : Text;
    scopeKerja : Text;
    status : Text;
    saldoJamEfektif : Nat;
    jamOnHold : Nat;
    deadline : Int;
  };

  public type InternalData = {
    partnerId : Principal;
    scopeKerja : Text;
    deadline : Int;
    linkDriveInternal : Text;
    jamEfektif : Nat;
    levelPartner : Text;
  };

  public type TaskStatus = {
    #Requested;
    #AwaitingClientApproval;
    #PendingPartner;
    #RejectedByPartner;
    #OnProgress;
    #InQA;
    #ClientReview;
    #Revision;
    #Completed;
  };

  public type Task = {
    id : Text;
    layananId : Text;
    clientId : Principal;
    judul : Text;
    detailPermintaan : Text;
    status : TaskStatus;
    estimasiJam : Nat;
    internalData : ?InternalData;
    linkDriveClient : ?Text;
  };

  public type TaskClientView = {
    id : Text;
    layananId : Text;
    clientId : Principal;
    judul : Text;
    detailPermintaan : Text;
    status : Text;
    estimasiJam : Nat;
    internalData : ?InternalData;
    linkDriveClient : ?Text;
  };

  public type FinancialResult = {
    status : Text;
    taskId : Text;
    jamDibakar : Nat;
    jumlahBayar : Nat;
    partnerFee : Nat;
    platformFee : Nat;
    partnerReferralFee : Nat;
  };

  public type CreateTaskResult = {
    #ok : Text;
    #err : Text;
  };

  public type InputEstimasiAMResult = {
    #ok : Text;
    #err : Text;
  };

  public type ApproveEstimasiClientResult = {
    #ok : Text;
    #err : Text;
  };

  public type AssignPartnerResult = {
    #ok : Text;
    #err : Text;
  };

  public type ResponPartnerResult = {
    #ok : Text;
    #err : Text;
  };

  public type UpdateTaskStatusResult = {
    #ok : Text;
    #err : Text;
  };

  public type CompleteTaskResult = {
    #ok : FinancialResult;
    #err : Text;
  };

  public type WithdrawStatus = {
    #Pending;
    #Approved;
    #Rejected;
  };

  public type WithdrawRequest = {
    id : Text;
    partnerId : Principal;
    amount : Nat;
    status : WithdrawStatus;
    requestedAt : Int;
    processedBy : ?Principal;
    processedAt : ?Int;
  };

  public type PartnerWallet = {
    partnerId : Principal;
    availableBalance : Nat;
    pendingBalance : Nat;
    totalWithdrawn : Nat;
  };

  var withdrawRequestCounter = 0;

  let users = Map.empty<Principal, User>();
  let layanans = Map.empty<Text, Layanan>();
  let tasks = Map.empty<Text, Task>();

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  include MixinAuthorization(accessControlState);

  let withdrawRequests = Map.empty<Text, WithdrawRequest>();
  let partnerWallets = Map.empty<Principal, PartnerWallet>();

  /// Helper functions for ID generation
  func generateClientId() : async Text {
    let randomActor = Random.crypto();
    let randomNumber = await* randomActor.natRange(111111, 999999);
    "CA-" # randomNumber.toText();
  };

  func generatePartnerId() : async Text {
    let randomActor = Random.crypto();
    let randomNumber = await* randomActor.natRange(11111, 99999);
    "PA-" # randomNumber.toText();
  };

  func generateInternalId() : async Text {
    let randomActor = Random.crypto();
    let randomNumber = await* randomActor.natRange(1111, 9999);
    "INT-" # randomNumber.toText();
  };

  func generateTaskId() : async Text {
    let randomActor = Random.crypto();
    let randomNumber = await* randomActor.natRange(100000, 999999);
    "TSK-" # randomNumber.toText();
  };

  func generateBalanceId() : async Text {
    let randomActor = Random.crypto();
    let randomNumber = await* randomActor.natRange(100000, 999999);
    "BAL-" # randomNumber.toText();
  };

  public query ({ caller }) func getMyLayananAktif() : async [LayananClientView] {
    // Authorization: Only active clients can query their own layanan
    if (not isActiveClient(caller)) {
      Runtime.trap("Unauthorized: Only active clients can view their services");
    };

    // Filter active layanans for the caller with saldo 2 or more (at least 1 hour)
    layanans.values().toArray().filter(
      func(layanan) {
        layanan.status == #active and layanan.clientId == caller and layanan.saldoJamEfektif >= 2
      }
    ).map(func(layanan) {
      let unitAktif = layanan.saldoJamEfektif / 2 : Nat;
      let unitOnHold = layanan.jamOnHold / 2 : Nat;

      {
        layanan with
        unitAktif;
        unitOnHold;
        jumlahSharing = 1;
        namaAsistenmu = "MockNamaAsistenmu";
        status = "active";
        saldo = layanan.saldoJamEfektif;
      };
    });
  };

  public query ({ caller }) func getClientMainService() : async ?Layanan {
    // Authorization: Only active clients can query their own main service
    if (not isActiveClient(caller)) {
      Runtime.trap("Unauthorized: Only active clients can view their main service");
    };

    let activeLayanan = layanans.values().toArray().find(func(layanan) {
      layanan.clientId == caller and layanan.status == #active
    });

    switch (activeLayanan) {
      case (?layanan) { ?layanan };
      case (null) { null };
    };
  };

  private func isAuthorizedAdmin(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        user.status == #active and (user.role == #superadmin or user.role == #admin);
      };
    };
  };

  private func isAccountManager(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        user.status == #active and (user.role == #superadmin or user.role == #admin or user.role == #asistenmu or user.role == #concierge);
      };
    };
  };

  private func isActiveClient(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        user.status == #active and user.role == #client;
      };
    };
  };

  private func isActivePartner(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        user.status == #active and user.role == #partner;
      };
    };
  };

  private func isFinance(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        user.status == #active and (user.role == #finance or user.role == #superadmin or user.role == #admin);
      };
    };
  };

  public shared ({ caller }) func claimSuperadmin() : async () {
    let superadminExists = users.values().any(func(user : User) : Bool { user.role == #superadmin });

    if (superadminExists) {
      Runtime.trap("Superadmin already exists. Can only be claimed once!");
    };

    let user : User = {
      principalId = caller;
      idUser = "SA-0001";
      name = "Superadmin Asistenku";
      kotaDomisili = null;
      companyBisnis = null;
      role = #superadmin;
      status = #active;
      createdAt = Time.now();
      phoneNumber = null;
      email = null;
    };

    users.add(caller, user);
  };

  public query ({ caller }) func getPendingRequests() : async [User] {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Superadmin and Admin roles can perform this action");
    };

    let pendingUsers = users.values().toArray().filter(
      func(user : User) : Bool {
        user.status == #pending;
      }
    );

    pendingUsers.sort(
      func(a : User, b : User) : { #less; #equal; #greater } {
        if (a.createdAt < b.createdAt) { #less } else if (a.createdAt > b.createdAt) { #greater } else { #equal };
      }
    );
  };

  public shared ({ caller }) func approveUser(principalId : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Superadmin and Admin roles can perform this action");
    };

    switch (users.get(principalId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedUser = { user with status = #active };
        users.add(principalId, updatedUser);

        let accessControlRole = switch (user.role) {
          case (#superadmin) { #admin };
          case (#admin) { #admin };
          case (_) { #user };
        };
        AccessControl.assignRole(accessControlState, caller, principalId, accessControlRole);
      };
    };
  };

  public shared ({ caller }) func rejectUser(principalId : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Superadmin and Admin roles can perform this action");
    };

    let user = switch (users.get(principalId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };

    let rejectedUser : User = {
      principalId = user.principalId;
      name = user.name;
      role = user.role;
      status = #rejected;
      createdAt = user.createdAt;
      kotaDomisili = user.kotaDomisili;
      companyBisnis = user.companyBisnis;
      idUser = user.idUser;
      phoneNumber = user.phoneNumber;
      email = user.email;
    };

    users.add(principalId, rejectedUser);
  };

  public shared ({ caller }) func updateUserRole(principalId : Principal, newRole : Role) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Superadmin and Admin roles can perform this action");
    };

    switch (users.get(principalId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedUser = { user with role = newRole };
        users.add(principalId, updatedUser);

        let accessControlRole = switch (updatedUser.role) {
          case (#superadmin) { #admin };
          case (#admin) { #admin };
          case (_) { #user };
        };
        AccessControl.assignRole(accessControlState, caller, principalId, accessControlRole);
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    switch (users.get(caller)) {
      case (null) { null };
      case (?user) {
        ?{
          name = user.name;
          requestedRole = null;
          phoneNumber = user.phoneNumber;
          email = user.email;
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(principalId : Principal) : async ?User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != principalId and not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(principalId);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    switch (profile.requestedRole) {
      case (null) { Runtime.trap("Role is required. For field requestedRole e.g. #user "); };
      case (?_role) {
        let user = {
          principalId = caller;
          name = profile.name;
          role = #client;
          status = #pending;
          createdAt = Time.now();
          kotaDomisili = null;
          companyBisnis = null;
          idUser = "";
          phoneNumber = profile.phoneNumber;
          email = profile.email;
        };
        users.add(caller, user);
      };
    };
  };

  public shared ({ caller }) func updateProfile(name : Text, phoneNumber : Text, email : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User not found. Please register first.");
      };
      case (?user) {
        if (user.status != #active) {
          Runtime.trap("Unauthorized: Only active users can update their profile");
        };

        let updatedUser = {
          user with
          name = name;
          phoneNumber = ?phoneNumber;
          email = ?email;
        };
        users.add(caller, updatedUser);
      };
    };
  };

  public shared ({ caller }) func registerInternalStaff(principalId : Principal, name : Text, role : Text) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Superadmin and Admin roles can create internal users");
    };

    var roleInternalUser : Role = #client;

    switch (role) {
      case ("superadmin") {
        roleInternalUser := #superadmin;
      };
      case ("admin") {
        roleInternalUser := #admin;
      };
      case ("finance") {
        roleInternalUser := #finance;
      };
      case ("concierge") {
        roleInternalUser := #concierge;
      };
      case ("strategicPartner") {
        roleInternalUser := #strategicPartner;
      };
      case ("asistenmu") {
        roleInternalUser := #asistenmu;
      };
      case ("client") {
        roleInternalUser := #client;
      };
      case ("partner") {
        roleInternalUser := #partner;
      };
      case (_) {
        Runtime.trap("Role internal tidak valid!");
      };
    };

    let user : User = {
      principalId;
      name;
      role = roleInternalUser;
      status = #active;
      createdAt = Time.now();
      kotaDomisili = null;
      companyBisnis = null;
      idUser = "";
      phoneNumber = null;
      email = null;
    };

    users.add(principalId, user);

    let accessControlRole = switch (roleInternalUser) {
      case (#superadmin) { #admin };
      case (#admin) { #admin };
      case (_) { #user };
    };

    AccessControl.assignRole(accessControlState, caller, principalId, accessControlRole);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public query ({ caller }) func getCurrentUser() : async ?User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their profile");
    };
    users.get(caller);
  };

  public shared ({ caller }) func selfRegisterClient(name : Text, company : Text, phoneNumber : Text, email : Text) : async () {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered! Please use login.");
    };

    let idUser = await generateClientId();
    let newUser : User = {
      principalId = caller;
      name;
      role = #client;
      status = #pending;
      createdAt = Time.now();
      kotaDomisili = null;
      companyBisnis = ?company;
      idUser;
      phoneNumber = ?phoneNumber;
      email = ?email;
    };
    users.add(caller, newUser);
  };

  public shared ({ caller }) func selfRegisterPartner(name : Text, kota : Text) : async () {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered! Please use login.");
    };

    let idUser = await generatePartnerId();
    let newUser : User = {
      principalId = caller;
      name;
      role = #partner;
      status = #pending;
      createdAt = Time.now();
      kotaDomisili = ?kota;
      companyBisnis = null;
      idUser;
      phoneNumber = null;
      email = null;
    };
    users.add(caller, newUser);
  };

  public shared ({ caller }) func selfRegisterInternal(name : Text, inputRole : Text) : async () {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered! Please use login.");
    };

    let allowedRoles = [
      "admin",
      "finance",
      "concierge",
      "asistenmu",
      "strategicPartner",
    ];

    let isValidRole = allowedRoles.any(func(role) { role == inputRole });

    if (not isValidRole) {
      Runtime.trap("Invalid internal role. Must be one of: admin, finance, concierge, asistenmu, strategicPartner");
    };

    var requestedRole : Role = #admin;
    switch (inputRole) {
      case ("admin") { requestedRole := #admin };
      case ("finance") { requestedRole := #finance };
      case ("concierge") { requestedRole := #concierge };
      case ("asistenmu") { requestedRole := #asistenmu };
      case ("strategicPartner") { requestedRole := #strategicPartner };
      case (_) {
        Runtime.trap("Role internal tidak valid!");
      };
    };

    let idUser = await generateInternalId();
    let newUser : User = {
      principalId = caller;
      name;
      role = requestedRole;
      status = #pending;
      createdAt = Time.now();
      kotaDomisili = null;
      companyBisnis = null;
      idUser;
      phoneNumber = null;
      email = null;
    };

    users.add(caller, newUser);
  };

  public shared ({ caller }) func createTask(clientId : Principal, layananId : Text, judul : Text, detailPermintaan : Text) : async CreateTaskResult {
    if (not isActiveClient(caller) and not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only active clients or admins can create tasks");
    };

    if (isActiveClient(caller) and caller != clientId) {
      Runtime.trap("Unauthorized: Clients can only create tasks for themselves");
    };

    switch (layanans.get(layananId)) {
      case (null) {
        #err("LayananId tidak ditemukan. Pastikan id layanan sudah benar.");
      };
      case (?layanan) {
        if (layanan.clientId != clientId) {
          return #err("Layanan tidak dimiliki oleh client yang ditentukan.");
        };

        if (layanan.saldoJamEfektif < 2) {
          return #err("Layanan saldo jam tidak cukup. Minimum request adalah 1 jam (2 unit), saldo jam sekarang: " # layanan.saldoJamEfektif.toText());
        };

        let _layanan = layanan;
        let taskId = await generateTaskId();
        let newTask : Task = {
          id = taskId;
          layananId;
          clientId;
          judul;
          detailPermintaan;
          status = #Requested : TaskStatus;
          estimasiJam = 0;
          internalData = null;
          linkDriveClient = null;
        };

        tasks.add(taskId, newTask);
        #ok(taskId);
      };
    };
  };

  public shared ({ caller }) func inputEstimasiAM(taskId : Text, estimasiJam : Nat) : async InputEstimasiAMResult {
    if (not isAccountManager(caller)) {
      Runtime.trap("Unauthorized: Only Account Managers (admin, asistenmu, concierge) can input time estimates");
    };

    if (estimasiJam == 0) {
      return #err("Jumlah jam estimasi tidak boleh 0. Minimal 1 jam atau 2 unit");
    };

    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        let updatedTask = {
          task with
          estimasiJam;
          status = #AwaitingClientApproval : TaskStatus;
        };
        tasks.add(taskId, updatedTask);
        #ok("Estimasi jam task berhasil diproses. Task id: " # taskId);
      };
    };
  };

  public shared ({ caller }) func approveEstimasiClient(taskId : Text) : async ApproveEstimasiClientResult {
    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        if (task.clientId != caller) {
          Runtime.trap("Unauthorized: Only the client who owns the task can approve it");
        };

        if (task.status != #AwaitingClientApproval) {
          return #err("Task is not in a state awaiting client approval");
        };

        switch (layanans.get(task.layananId)) {
          case (null) {
            #err("LayananId tidak ditemukan. Pastikan layanan masih aktif.");
          };
          case (?layanan) {
            if (layanan.saldoJamEfektif < task.estimasiJam) {
              return #err("Layanan saldo jam tidak cukup untuk task ini. Saldo sekarang: " # layanan.saldoJamEfektif.toText());
            };

            let updatedLayanan = {
              layanan with
              saldoJamEfektif = layanan.saldoJamEfektif - task.estimasiJam
            };

            let updatedTask = {
              task with
              status = #PendingPartner;
            };

            layanans.add(task.layananId, updatedLayanan);
            tasks.add(taskId, updatedTask);

            #ok("Task approved and saldo deducted. Task id: " # taskId # ", saldo layanan sekarang: " # updatedLayanan.saldoJamEfektif.toText());
          };
        };
      };
    };
  };

  public shared ({ caller }) func assignPartner(taskId : Text, partnerId : Principal, scopeKerja : Text, deadline : Int, linkDriveInternal : Text, jamEfektif : Nat, levelPartner : Text) : async AssignPartnerResult {
    if (not isAccountManager(caller)) {
      Runtime.trap("Unauthorized: Only account managers (AM) can assign partners to tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        if (task.status != #PendingPartner) {
          return #err("Task is not pending partner assignment");
        };

        let internalData = {
          partnerId;
          scopeKerja;
          deadline;
          linkDriveInternal;
          jamEfektif;
          levelPartner;
        };

        let updatedTask = {
          task with
          internalData = ?internalData;
        };

        tasks.add(taskId, updatedTask);

        #ok("Partner assigned to task: " # taskId);
      };
    };
  };

  public shared ({ caller }) func responPartner(taskId : Text, acceptance : Bool) : async ResponPartnerResult {
    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        switch (task.internalData) {
          case (null) {
            #err("Task does not have partner assignment details");
          };
          case (?internalData) {
            if (internalData.partnerId != caller) {
              Runtime.trap("Unauthorized: Only the assigned partner can respond to this task");
            };

            if (task.status != #PendingPartner) {
              return #err("Task is not in a state pending partner response");
            };

            if (acceptance) {
              let updatedTask = {
                task with
                status = #OnProgress;
                internalData = ?internalData;
              };

              tasks.add(taskId, updatedTask);

              #ok("Task accepted by partner: " # taskId);
            } else {
              switch (layanans.get(task.layananId)) {
                case (null) {
                  #err("LayananId tidak ditemukan. Balancing refund failed");
                };
                case (?layanan) {
                  let updatedLayanan = {
                    layanan with
                    saldoJamEfektif = layanan.saldoJamEfektif + task.estimasiJam
                  };

                  let updatedTask = {
                    task with
                    status = #RejectedByPartner;
                    internalData = null;
                  };

                  layanans.add(task.layananId, updatedLayanan);
                  tasks.add(taskId, updatedTask);

                  #ok("Task rejected by partner and saldo refunded. Task id: " # taskId);
                };
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateTaskStatus(taskId : Text, newStatus : TaskStatus) : async UpdateTaskStatusResult {
    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        if (isAccountManager(caller)) {
          let updatedTask = { task with status = newStatus };
          tasks.add(taskId, updatedTask);
          return #ok("Task status updated successfully. Task id: " # taskId);
        };

        switch (task.internalData) {
          case (null) {
            Runtime.trap("Unauthorized: Only account managers can update task status");
          };
          case (?internalData) {
            if (internalData.partnerId == caller and isActivePartner(caller)) {
              let updatedTask = { task with status = newStatus };
              tasks.add(taskId, updatedTask);
              return #ok("Task status updated successfully. Task id: " # taskId);
            } else {
              Runtime.trap("Unauthorized: Only account managers or assigned partners can update task status");
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func completeTask(taskId : Text) : async CompleteTaskResult {
    if (not isAccountManager(caller)) {
      Runtime.trap("Unauthorized: Only account managers can complete tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        switch (layanans.get(task.layananId)) {
          case (null) {
            #err("LayananId tidak ditemukan. Pastikan layanan masih aktif.");
          };
          case (?layanan) {
            if (task.status != #OnProgress) {
              return #err("Task must be in OnProgress status to complete. Task id: " # taskId);
            };

            switch (task.internalData) {
              case (null) {
                return #err("Task does not have internal data for completion. Task id: " # taskId);
              };
              case (?internalData) {
                if (layanan.jamOnHold < task.estimasiJam) {
                  return #err("Insufficient jamOnHold balance for completion. Task id: " # taskId);
                };
                let updatedLayanan = {
                  layanan with
                  jamOnHold = layanan.jamOnHold - task.estimasiJam;
                };

                let hourlyRate = switch (internalData.levelPartner) {
                  case ("Junior") { 35000 };
                  case ("Senior") { 55000 };
                  case ("Expert") { 75000 };
                  case (_) { 0 };
                };

                let partnerPayment : Nat = internalData.jamEfektif * hourlyRate;

                let updatedTask = { task with status = #Completed };

                let financialResult : FinancialResult = {
                  status = "success";
                  taskId;
                  jamDibakar = task.estimasiJam;
                  jumlahBayar = internalData.jamEfektif;
                  partnerFee = partnerPayment;
                  platformFee = partnerPayment / 4 : Nat;
                  partnerReferralFee = partnerPayment / 20 : Nat;
                };

                layanans.add(task.layananId, updatedLayanan);
                tasks.add(taskId, updatedTask);

                #ok(financialResult);
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getClientTasks(clientId : Principal) : async [TaskClientView] {
    if (caller != clientId and not isAccountManager(caller)) {
      Runtime.trap("Unauthorized: Only the client or account managers can query client tasks");
    };

    tasks.values().toArray().filter(
      func(task) {
        task.clientId == clientId;
      }
    ).map(
      func(task) : TaskClientView {
        let maskedStatus = switch (task.status) {
          case (#PendingPartner) { "Sedang Didelegasikan" };
          case (#RejectedByPartner) { "Sedang Didelegasikan" };
          case (#OnProgress) { "Sedang Dikerjakan" };
          case (#InQA) { "Quality Assurance" };
          case (#ClientReview) { "Client Review" };
          case (#Revision) { "Revision" };
          case (#Completed) { "Completed" };
          case (#Requested) { "Requested" };
          case (#AwaitingClientApproval) { "Awaiting Client Approval" };
        };

        {
          task with
          status = maskedStatus;
          internalData = null;
        };
      }
    );
  };

  public shared ({ caller }) func addPartnerBalance(partnerId : Principal, amount : Nat) : async Text {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Superadmin and Admin roles can perform this action");
    };

    switch (partnerWallets.get(partnerId)) {
      case (null) {
        let newWallet : PartnerWallet = {
          partnerId;
          availableBalance = amount;
          pendingBalance = 0;
          totalWithdrawn = 0;
        };
        partnerWallets.add(partnerId, newWallet);
        "Wallet created and balance added successfully";
      };
      case (?wallet) {
        let updatedWallet = {
          wallet with
          availableBalance = wallet.availableBalance + amount;
        };
        partnerWallets.add(partnerId, updatedWallet);
        "Balance added to existing wallet successfully";
      };
    };
  };

  public shared ({ caller }) func requestWithdraw(partnerId : Principal, amount : Nat) : async Text {
    if (caller != partnerId) {
      Runtime.trap("Unauthorized: Only the partner can request their own withdrawal");
    };

    if (not isActivePartner(caller)) {
      Runtime.trap("Unauthorized: Only active partners can request withdrawals");
    };

    if (amount == 0) {
      Runtime.trap("Withdrawal amount must be greater than zero");
    };

    switch (partnerWallets.get(partnerId)) {
      case (null) {
        Runtime.trap("Partner wallet not found");
      };
      case (?wallet) {
        if (wallet.availableBalance < amount) {
          Runtime.trap("Insufficient balance for withdrawal");
        };

        let updatedWallet = {
          wallet with
          availableBalance = wallet.availableBalance - amount;
          pendingBalance = wallet.pendingBalance + amount;
        };
        partnerWallets.add(partnerId, updatedWallet);

        let requestId = "WD-" # Time.now().toText() # "-" # withdrawRequestCounter.toText();

        let newRequest : WithdrawRequest = {
          id = requestId;
          partnerId;
          amount;
          status = #Pending;
          requestedAt = Time.now();
          processedBy = null;
          processedAt = null;
        };
        withdrawRequests.add(requestId, newRequest);

        withdrawRequestCounter += 1;

        requestId;
      };
    };
  };

  public shared ({ caller }) func approveWithdraw(requestId : Text, financeId : Principal) : async Text {
    if (not isFinance(caller)) {
      Runtime.trap("Unauthorized: Only finance role can approve withdrawals");
    };

    switch (withdrawRequests.get(requestId)) {
      case (null) {
        Runtime.trap("Withdrawal request not found");
      };
      case (?withdrawRequest) {
        if (withdrawRequest.status != #Pending) {
          Runtime.trap("Withdrawal request is not pending");
        };

        switch (partnerWallets.get(withdrawRequest.partnerId)) {
          case (null) {
            Runtime.trap("Partner wallet not found");
          };
          case (?wallet) {
            let updatedWallet = {
              wallet with
              pendingBalance = wallet.pendingBalance - withdrawRequest.amount;
              totalWithdrawn = wallet.totalWithdrawn + withdrawRequest.amount;
            };
            partnerWallets.add(withdrawRequest.partnerId, updatedWallet);

            let updatedRequest = {
              withdrawRequest with
              status = #Approved;
              processedBy = ?caller;
              processedAt = ?Time.now();
            };
            withdrawRequests.add(requestId, updatedRequest);

            "Withdrawal approved successfully";
          };
        };
      };
    };
  };

  public shared ({ caller }) func rejectWithdraw(requestId : Text, financeId : Principal) : async Text {
    if (not isFinance(caller)) {
      Runtime.trap("Unauthorized: Only finance role can reject withdrawals");
    };

    switch (withdrawRequests.get(requestId)) {
      case (null) {
        Runtime.trap("Withdrawal request not found");
      };
      case (?withdrawRequest) {
        if (withdrawRequest.status != #Pending) {
          Runtime.trap("Withdrawal request is not pending");
        };

        switch (partnerWallets.get(withdrawRequest.partnerId)) {
          case (null) {
            Runtime.trap("Partner wallet not found");
          };
          case (?wallet) {
            let updatedWallet = {
              wallet with
              pendingBalance = wallet.pendingBalance - withdrawRequest.amount;
              availableBalance = wallet.availableBalance + withdrawRequest.amount;
            };
            partnerWallets.add(withdrawRequest.partnerId, updatedWallet);

            let updatedRequest = {
              withdrawRequest with
              status = #Rejected;
              processedBy = ?caller;
              processedAt = ?Time.now();
            };
            withdrawRequests.add(requestId, updatedRequest);

            "Withdrawal rejected and balance refunded successfully";
          };
        };
      };
    };
  };
};
