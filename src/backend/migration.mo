import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type Role = {
    #superadmin;
    #admin;
    #finance;
    #concierge;
    #strategicPartner;
    #asistenmu;
    #client;
    #partner;
  };

  type Status = {
    #pending;
    #active;
  };

  type User = {
    principalId : Principal.Principal;
    name : Text;
    role : Role;
    status : Status;
    createdAt : Int;
    kotaDomisili : ?Text;
    companyBisnis : ?Text;
    idUser : Text;
  };

  type OldInternalData = {
    partnerId : Principal.Principal;
    scopeKerja : Text;
    deadline : Int;
    linkDriveInternal : Text;
  };

  type NewInternalData = {
    partnerId : Principal.Principal;
    scopeKerja : Text;
    deadline : Int;
    linkDriveInternal : Text;
    jamEfektif : Nat;
    levelPartner : Text;
  };

  type TaskStatus = {
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

  type OldTask = {
    id : Text;
    layananId : Text;
    clientId : Principal.Principal;
    judul : Text;
    detailPermintaan : Text;
    status : TaskStatus;
    estimasiJam : Nat;
    internalData : ?OldInternalData;
    linkDriveClient : ?Text;
  };

  type NewTask = {
    id : Text;
    layananId : Text;
    clientId : Principal.Principal;
    judul : Text;
    detailPermintaan : Text;
    status : TaskStatus;
    estimasiJam : Nat;
    internalData : ?NewInternalData;
    linkDriveClient : ?Text;
  };

  type OldLayanan = {
    id : Text;
    nama : Text;
    scopeKerja : Text;
    clientId : Principal.Principal;
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
    adminId : Principal.Principal;
    layananType : {
      #reportWriting;
      #assistance;
      #dataEntry;
    };
    resourceType : {
      #standard;
      #dedicated;
    };
  };

  type NewLayanan = OldLayanan and { jamOnHold : Nat };

  type OldActor = {
    users : Map.Map<Principal.Principal, User>;
    layanans : Map.Map<Text, OldLayanan>;
    tasks : Map.Map<Text, OldTask>;
  };

  type NewActor = {
    users : Map.Map<Principal.Principal, User>;
    layanans : Map.Map<Text, NewLayanan>;
    tasks : Map.Map<Text, NewTask>;
  };

  public func run(old : OldActor) : NewActor {
    let updatedTasks = old.tasks.map<Text, OldTask, NewTask>(
      func(_id, task) {
        {
          task with
          internalData = switch (task.internalData) {
            case (null) { null };
            case (?data) {
              ?{
                data with
                jamEfektif = 0; // Default value for jamEfektif
                levelPartner = ""; // Default value for levelPartner
              };
            };
          };
        };
      }
    );
    let updatedLayanans = old.layanans.map<Text, OldLayanan, NewLayanan>(
      func(_id, layanan) {
        { layanan with jamOnHold = 0 };
      }
    );
    { old with layanans = updatedLayanans; tasks = updatedTasks };
  };
};
