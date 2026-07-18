/**
 * @file access-control.service.ts
 * @module @academorix/access-control/services/access-control
 *
 * @description
 * Concrete `@Injectable()` implementation of `IAccessControlService`
 * (from `@academorix/contracts`). Guard-aware — the module
 * registers two instances (platform + tenant) with different
 * endpoint bags.
 */

import { Injectable, Inject } from "@academorix/container";
import {
  ACCESS_CONTROL_OPTIONS_TOKEN,
  Guard,
  HTTP_SERVICE,
  type IAbilityData,
  type IAccessControlConfig,
  type IAccessControlEndpoints,
  type IAccessControlService,
  type ICanRequest,
  type ICanResponse,
  type IHttpService,
  type IMePayload,
  type IPermissionData,
  type IRoleAssignmentData,
  type IRoleData,
} from "@academorix/contracts";
import { encodeUrlSegment } from "@academorix/http";

import type { AssignRoleInputSchema } from "../../schemas/assign-role-input.schema";
import type { CreatePermissionInputSchema } from "../../schemas/create-permission-input.schema";
import type { CreateRoleInputSchema } from "../../schemas/create-role-input.schema";
import type { SyncRolePermissionsInputSchema } from "../../schemas/sync-role-permissions-input.schema";
import type { UpdatePermissionInputSchema } from "../../schemas/update-permission-input.schema";
import type { UpdateRoleInputSchema } from "../../schemas/update-role-input.schema";

/**
 * Base concrete service. The module extends it into two
 * subclasses (`PlatformAccessControlService`,
 * `TenantAccessControlService`) so DI can distinguish them by
 * class identity while sharing all behaviour.
 *
 * @category Service
 */
@Injectable()
export abstract class AccessControlService implements IAccessControlService {
  /** Which endpoint bag this instance uses. */
  protected abstract readonly guard: Guard;

  public constructor(
    @Inject(HTTP_SERVICE) protected readonly http: IHttpService,
    @Inject(ACCESS_CONTROL_OPTIONS_TOKEN)
    protected readonly config: IAccessControlConfig,
  ) {}

  /** Pick the endpoint bag for the current guard. */
  protected get endpoints(): IAccessControlEndpoints {
    return this.guard === Guard.Platform
      ? this.config.platformEndpoints
      : this.config.tenantEndpoints;
  }

  // -----------------------------------------------------------
  // Ability checks
  // -----------------------------------------------------------

  /** {@inheritDoc IAccessControlService.can} */
  public can(input: ICanRequest): Promise<ICanResponse> {
    return this.http.post<ICanResponse>(this.endpoints.can, input);
  }

  /** {@inheritDoc IAccessControlService.listMyAbilities} */
  public listMyAbilities(): Promise<readonly IAbilityData[]> {
    return this.http.get<readonly IAbilityData[]>(this.endpoints.mine);
  }

  /** {@inheritDoc IAccessControlService.fetchBootPayload} */
  public fetchBootPayload(): Promise<IMePayload> {
    return this.http.get<IMePayload>(this.config.meEndpoint);
  }

  // -----------------------------------------------------------
  // Permissions CRUD
  // -----------------------------------------------------------

  public listPermissions(): Promise<readonly IPermissionData[]> {
    return this.http.get<readonly IPermissionData[]>(this.endpoints.permissions);
  }

  public showPermission(id: string): Promise<IPermissionData> {
    return this.http.get<IPermissionData>(`${this.endpoints.permissions}/${encodeUrlSegment(id)}`);
  }

  public createPermission(input: CreatePermissionInputSchema): Promise<IPermissionData> {
    return this.http.post<IPermissionData>(this.endpoints.permissions, input);
  }

  public updatePermission(
    id: string,
    input: UpdatePermissionInputSchema,
  ): Promise<IPermissionData> {
    return this.http.patch<IPermissionData>(
      `${this.endpoints.permissions}/${encodeUrlSegment(id)}`,
      input,
    );
  }

  // -----------------------------------------------------------
  // Roles CRUD
  // -----------------------------------------------------------

  public listRoles(): Promise<readonly IRoleData[]> {
    return this.http.get<readonly IRoleData[]>(this.endpoints.roles);
  }

  public showRole(id: string): Promise<IRoleData> {
    return this.http.get<IRoleData>(`${this.endpoints.roles}/${encodeUrlSegment(id)}`);
  }

  public createRole(input: CreateRoleInputSchema): Promise<IRoleData> {
    return this.http.post<IRoleData>(this.endpoints.roles, input);
  }

  public updateRole(id: string, input: UpdateRoleInputSchema): Promise<IRoleData> {
    return this.http.patch<IRoleData>(`${this.endpoints.roles}/${encodeUrlSegment(id)}`, input);
  }

  public deleteRole(id: string): Promise<void> {
    return this.http.delete<void>(`${this.endpoints.roles}/${encodeUrlSegment(id)}`);
  }

  // -----------------------------------------------------------
  // Role-permission sync
  // -----------------------------------------------------------

  public syncRolePermissions(
    roleId: string,
    input: SyncRolePermissionsInputSchema,
  ): Promise<IRoleData> {
    return this.http.post<IRoleData>(this.endpoints.rolePermissions(roleId), input);
  }

  // -----------------------------------------------------------
  // User-role assignments
  // -----------------------------------------------------------

  public assignRole(userId: string, input: AssignRoleInputSchema): Promise<IRoleAssignmentData> {
    return this.http.post<IRoleAssignmentData>(this.endpoints.userRoles(userId), input);
  }

  public revokeRole(userId: string, roleId: string): Promise<void> {
    return this.http.delete<void>(this.endpoints.userRole(userId, roleId));
  }
}

/**
 * Concrete platform-scoped service.
 */
@Injectable()
export class PlatformAccessControlService extends AccessControlService {
  protected readonly guard = Guard.Platform;
}

/**
 * Concrete tenant-scoped service.
 */
@Injectable()
export class TenantAccessControlService extends AccessControlService {
  protected readonly guard = Guard.Tenant;
}
