import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface User {
    status: Status;
    name: string;
    createdAt: bigint;
    role: Role;
    principalId: Principal;
}
export interface UserProfile {
    name: string;
    requestedRole?: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum Role {
    client = "client",
    admin = "admin",
    finance = "finance",
    strategicPartner = "strategicPartner",
    concierge = "concierge",
    asistenmu = "asistenmu",
    superadmin = "superadmin",
    partner = "partner"
}
export enum Status {
    active = "active",
    pending = "pending"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveUser(principalId: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimSuperadmin(): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentUser(): Promise<User | null>;
    getPendingRequests(): Promise<Array<User>>;
    getUserProfile(principalId: Principal): Promise<User | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    registerInternalStaff(principalId: Principal, name: string, role: string): Promise<void>;
    rejectUser(principalId: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegisterClient(name: string): Promise<void>;
    selfRegisterInternal(name: string, inputRole: string): Promise<void>;
    selfRegisterPartner(name: string): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
}
