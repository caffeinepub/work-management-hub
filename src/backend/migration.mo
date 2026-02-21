import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
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

  public type OldActor = {
    users : Map.Map<Principal, User>;
  };

  public type NewActor = {
    users : Map.Map<Principal, User>;
  };

  public func run(old : OldActor) : NewActor {
    // No changes needed, just return old actor as new
    { users = old.users };
  };
};
