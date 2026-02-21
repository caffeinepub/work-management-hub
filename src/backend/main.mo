import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import UserApproval "user-approval/approval";
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
  };

  public type UserProfile = {
    name : Text;
    requestedRole : ?Text;
  };

  let users = Map.empty<Principal, User>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  private func isAuthorizedAdmin(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        user.status == #active and (user.role == #superadmin or user.role == #admin);
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
      name = "Superadmin";
      role = #superadmin;
      status = #active;
      createdAt = Time.now();
    };

    users.add(caller, user);
    AccessControl.assignRole(accessControlState, caller, caller, #admin);
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

  // Remove access control check so all callers can access their own profile
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
      case (?role) {
        let user = {
          principalId = caller;
          name = profile.name;
          role = #client;
          status = #pending;
          createdAt = Time.now();
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

  // Allow anonymous users (caller = Anonymous Principal) to create new client account with pending status.
  public shared ({ caller }) func selfRegisterClient(name : Text) : async () {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered! Please use login.");
    };
    let newUser : User = {
      principalId = caller;
      name;
      role = #client;
      status = #pending;
      createdAt = Time.now();
    };
    users.add(caller, newUser);
  };

  // Allow anonymous users (caller = Anonymous Principal) to create new partner account with pending status.
  public shared ({ caller }) func selfRegisterPartner(name : Text) : async () {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered! Please use login.");
    };
    let newUser : User = {
      principalId = caller;
      name;
      role = #partner;
      status = #pending;
      createdAt = Time.now();
    };
    users.add(caller, newUser);
  };

  // Allow anonymous users to register as internal staff (admin, finance, concierge, asistenmu, strategicPartner) with pending status.
  // Expose the function as part of the actor for user registration
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

    let newUser : User = {
      principalId = caller;
      name;
      role = requestedRole;
      status = #pending;
      createdAt = Time.now();
    };

    users.add(caller, newUser);
  };
};
