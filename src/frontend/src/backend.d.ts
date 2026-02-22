import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TaskClientView {
    id: string;
    status: string;
    clientId: Principal;
    internalData?: InternalData;
    estimasiJam: bigint;
    judul: string;
    linkDriveClient?: string;
    detailPermintaan: string;
    layananId: string;
}
export type InputEstimasiAMResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface InternalData {
    levelPartner: string;
    jamEfektif: bigint;
    deadline: bigint;
    partnerId: Principal;
    scopeKerja: string;
    linkDriveInternal: string;
}
export type AssignPartnerResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface User {
    status: Status;
    referralCode?: string;
    clientRating?: bigint;
    approvedAt?: bigint;
    approvedBy?: Principal;
    lastActiveAt?: bigint;
    name: string;
    createdAt: bigint;
    role: Role;
    rejectionReason?: string;
    partnerLevel?: string;
    email?: string;
    referredBy?: string;
    rejectedAt?: bigint;
    rejectedBy?: Principal;
    partnerRating?: bigint;
    verificationTimestamp?: bigint;
    requestedRole?: string;
    verificationPartner?: Principal;
    phoneNumber?: string;
    idUser: string;
    statusUpdatedAt?: bigint;
    companyBisnis?: string;
    principalId: Principal;
    verificationStatus?: string;
    requestedAt?: bigint;
    requestedBy?: Principal;
    kotaDomisili?: string;
}
export type UpdateTaskStatusResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type CreateTaskResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type CompleteTaskResult = {
    __kind__: "ok";
    ok: FinancialResult;
} | {
    __kind__: "err";
    err: string;
};
export interface LayananClientView {
    id: string;
    status: string;
    unitAktif: bigint;
    harga: bigint;
    nama: string;
    jumlahSharing: bigint;
    deadline: bigint;
    saldo: bigint;
    scopeKerja: string;
    jamOnHold: bigint;
    unitOnHold: bigint;
    namaAsistenmu: string;
    saldoJamEfektif: bigint;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export type ResponPartnerResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type ApproveEstimasiClientResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface FinancialResult {
    status: string;
    platformFee: bigint;
    partnerReferralFee: bigint;
    taskId: string;
    jamDibakar: bigint;
    jumlahBayar: bigint;
    partnerFee: bigint;
}
export interface UserProfile {
    name: string;
    email?: string;
    requestedRole?: string;
    phoneNumber?: string;
}
export interface Layanan {
    id: string;
    status: Variant_active_pendingApproval_dormant_depleted;
    clientId: Principal;
    harga: bigint;
    nama: string;
    createdAt: bigint;
    deadline: bigint;
    resourceType: Variant_dedicated_standard;
    adminId: Principal;
    scopeKerja: string;
    layananType: Variant_reportWriting_assistance_dataEntry;
    jamOnHold: bigint;
    saldoOriginal: bigint;
    saldoJamEfektif: bigint;
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
    pending = "pending",
    rejected = "rejected"
}
export enum TaskStatus {
    PendingPartner = "PendingPartner",
    InQA = "InQA",
    ClientReview = "ClientReview",
    OnProgress = "OnProgress",
    Revision = "Revision",
    AwaitingClientApproval = "AwaitingClientApproval",
    Requested = "Requested",
    RejectedByPartner = "RejectedByPartner",
    Completed = "Completed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_pendingApproval_dormant_depleted {
    active = "active",
    pendingApproval = "pendingApproval",
    dormant = "dormant",
    depleted = "depleted"
}
export enum Variant_dedicated_standard {
    dedicated = "dedicated",
    standard = "standard"
}
export enum Variant_reportWriting_assistance_dataEntry {
    reportWriting = "reportWriting",
    assistance = "assistance",
    dataEntry = "dataEntry"
}
export interface backendInterface {
    addPartnerBalance(partnerId: Principal, amount: bigint): Promise<string>;
    approveEstimasiClient(taskId: string): Promise<ApproveEstimasiClientResult>;
    approveUser(principalId: Principal): Promise<void>;
    approveWithdraw(requestId: string, financeId: Principal): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignPartner(taskId: string, partnerId: Principal, scopeKerja: string, deadline: bigint, linkDriveInternal: string, jamEfektif: bigint, levelPartner: string): Promise<AssignPartnerResult>;
    claimSuperadmin(): Promise<void>;
    completeTask(taskId: string): Promise<CompleteTaskResult>;
    createTask(clientId: Principal, layananId: string, judul: string, detailPermintaan: string): Promise<CreateTaskResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClientMainService(): Promise<Layanan | null>;
    getClientTasks(clientId: Principal): Promise<Array<TaskClientView>>;
    getCurrentUser(): Promise<User | null>;
    getMyLayananAktif(): Promise<Array<LayananClientView>>;
    getPendingRequests(): Promise<Array<User>>;
    getUserProfile(principalId: Principal): Promise<User | null>;
    inputEstimasiAM(taskId: string, estimasiJam: bigint): Promise<InputEstimasiAMResult>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    registerInternalStaff(principalId: Principal, name: string, role: string): Promise<void>;
    rejectUser(principalId: Principal): Promise<void>;
    rejectWithdraw(requestId: string, financeId: Principal): Promise<string>;
    requestApproval(): Promise<void>;
    requestWithdraw(partnerId: Principal, amount: bigint): Promise<string>;
    responPartner(taskId: string, acceptance: boolean): Promise<ResponPartnerResult>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegisterClient(name: string, company: string, phoneNumber: string, email: string): Promise<void>;
    selfRegisterInternal(name: string, inputRole: string): Promise<void>;
    selfRegisterPartner(name: string, kota: string): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    updateProfile(name: string, phoneNumber: string, email: string): Promise<void>;
    updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<UpdateTaskStatusResult>;
    updateUserRole(principalId: Principal, newRole: Role): Promise<void>;
}
