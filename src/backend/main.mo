import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import UserApproval "user-approval/approval";
import Random "mo:core/Random";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Migration "migration";

(with migration = Migration.run)
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
  };

  public type UserProfile = {
    name : Text;
    requestedRole : ?Text;
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

  let users = Map.empty<Principal, User>();
  let layanans = Map.empty<Text, Layanan>();
  let tasks = Map.empty<Text, Task>();

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  include MixinAuthorization(accessControlState);

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

    let userExists = users.containsKey(principalId);

    if (not userExists) {
      Runtime.trap("User not found");
    };

    users.remove(principalId);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    switch (users.get(caller)) {
      case (null) { null };
      case (?user) {
        ?{
          name = user.name;
          requestedRole = null;
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
        };
        users.add(caller, user);
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
    users.get(caller);
  };

  public shared ({ caller }) func selfRegisterClient(name : Text, company : Text) : async () {
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
    };

    users.add(caller, newUser);
  };

  // TASKS

  public shared ({ caller }) func createTask(clientId : Principal, layananId : Text, judul : Text, detailPermintaan : Text) : async CreateTaskResult {
    // Authorization: Only active clients can create tasks, and only for themselves
    // OR admins can create tasks on behalf of clients
    if (not isActiveClient(caller) and not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only active clients or admins can create tasks");
    };

    // If caller is a client (not admin), they can only create tasks for themselves
    if (isActiveClient(caller) and caller != clientId) {
      Runtime.trap("Unauthorized: Clients can only create tasks for themselves");
    };

    // Validate and fetch the Layanan
    switch (layanans.get(layananId)) {
      case (null) {
        #err("LayananId tidak ditemukan. Pastikan id layanan sudah benar.");
      };
      case (?layanan) {
        // Verify that the layanan belongs to the specified client
        if (layanan.clientId != clientId) {
          return #err("Layanan tidak dimiliki oleh client yang ditentukan.");
        };

        // Check balance, MUST be minimum 2 (1 jam)
        if (layanan.saldoJamEfektif < 2) {
          return #err("Layanan saldo jam tidak cukup. Minimum request adalah 1 jam (2 unit), saldo jam sekarang: " # layanan.saldoJamEfektif.toText());
        };

        // Generate new task
        let _layanan = layanan; // Avoid re-borrow error
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
    // Authorization: Only Account Managers (AM) can input estimates
    // AM roles: superadmin, admin, asistenmu, concierge
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
    // Authorization: Only the client who owns the task can approve
    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        if (task.clientId != caller) {
          return #err("Unauthorized: Only the client who owns the task can approve it");
        };

        if (task.status != #AwaitingClientApproval) {
          return #err("Task is not in a state awaiting client approval");
        };

        switch (layanans.get(task.layananId)) {
          case (null) {
            #err("LayananId tidak ditemukan. Pastikan layanan masih aktif.");
          };
          case (?layanan) {
            // Check if Layanan has enough saldo
            if (layanan.saldoJamEfektif < task.estimasiJam) {
              return #err("Layanan saldo jam tidak cukup untuk task ini. Saldo sekarang: " # layanan.saldoJamEfektif.toText());
            };

            // Deduct saldo from Layanan
            let updatedLayanan = {
              layanan with
              saldoJamEfektif = layanan.saldoJamEfektif - task.estimasiJam
            };

            // Update task status
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
    // Authorization: Only account managers (AM) can assign partners
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
    // Authorization: Only assigned partner can respond to task
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
              return #err("Unauthorized: Only the assigned partner can respond to this task");
            };

            // Check if Task is in PendingPartner status
            if (task.status != #PendingPartner) {
              return #err("Task is not in a state pending partner response");
            };

            if (acceptance) {
              // Partner accepted
              let updatedTask = {
                task with
                status = #OnProgress;
                internalData = ?internalData;
              };

              tasks.add(taskId, updatedTask);

              #ok("Task accepted by partner: " # taskId);
            } else {
              // Partner rejected, refund saldo to Layanan
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
    // Authorization: Account managers can update any task status
    // Partners can only update status for tasks assigned to them
    // This function manages revision cycles: OnProgress → InQA → ClientReview → Revision → OnProgress

    switch (tasks.get(taskId)) {
      case (null) {
        #err("Task tidak ditemukan. Pastikan id task sudah benar.");
      };
      case (?task) {
        // Check if caller is an account manager
        if (isAccountManager(caller)) {
          // Account managers can update any task
          let updatedTask = { task with status = newStatus };
          tasks.add(taskId, updatedTask);
          return #ok("Task status updated successfully. Task id: " # taskId);
        };

        // Check if caller is the assigned partner
        switch (task.internalData) {
          case (null) {
            Runtime.trap("Unauthorized: Only account managers can update task status");
          };
          case (?internalData) {
            if (internalData.partnerId == caller and isActivePartner(caller)) {
              // Partner can only update their assigned task
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
    // Authorization: Only account managers can complete tasks (financial trigger)
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
                // Burn units by subtracting jamEfektif from jamOnHold
                if (layanan.jamOnHold < task.estimasiJam) {
                  return #err("Insufficient jamOnHold balance for completion. Task id: " # taskId);
                };
                let updatedLayanan = {
                  layanan with
                  jamOnHold = layanan.jamOnHold - task.estimasiJam;
                };

                // Calculate partner payment based on partner's hourly rate
                let hourlyRate = switch (internalData.levelPartner) {
                  case ("Junior") { 35000 };
                  case ("Senior") { 55000 };
                  case ("Expert") { 75000 };
                  case (_) { 0 };
                };

                let partnerPayment : Nat = internalData.jamEfektif * hourlyRate;

                // Pseudo-code: Add partner payment to partner balance (needs implementation)
                // Add partner payment to partner's balance

                // Update task status to Completed
                let updatedTask = { task with status = #Completed };

                // Prepare financial result
                let financialResult : FinancialResult = {
                  status = "success";
                  taskId;
                  jamDibakar = task.estimasiJam;
                  jumlahBayar = internalData.jamEfektif;
                  partnerFee = partnerPayment;
                  platformFee = partnerPayment / 4 : Nat; // 25% platform fee
                  partnerReferralFee = partnerPayment / 20 : Nat; // 5% referral fee
                };

                // Update both layanan and task
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
    // Authorization: Clients can only query their own tasks
    // Account managers can query any client's tasks for management purposes
    if (caller != clientId and not isAccountManager(caller)) {
      Runtime.trap("Unauthorized: Only the client or account managers can query client tasks");
    };

    tasks.values().toArray().filter(
      func(task) {
        task.clientId == clientId;
      }
    ).map(
      func(task) : TaskClientView {
        // MASKING LOGIC: Hide partner rejection details from client view
        // PendingPartner and RejectedByPartner both display as "Sedang Didelegasikan"
        let maskedStatus = switch (task.status) {
          case (#PendingPartner) { "Sedang Didelegasikan" }; // Masking: hide pending partner status
          case (#RejectedByPartner) { "Sedang Didelegasikan" }; // Masking: hide rejection from client
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
          internalData = null; // Exclude internal data from client view
        };
      }
    );
  };
};
