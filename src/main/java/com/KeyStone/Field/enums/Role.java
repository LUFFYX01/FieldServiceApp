package com.KeyStone.Field.enums;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Set;
import java.util.stream.Collectors;

public enum Role {

    ADMIN(Set.of(
            // Customer Permissions
            Permission.CUSTOMER_CREATE,
            Permission.CUSTOMER_READ,
            Permission.CUSTOMER_UPDATE,
            Permission.CUSTOMER_DELETE,

            // User Permissions
            Permission.USER_CREATE,
            Permission.USER_READ,
            Permission.USER_UPDATE,
            Permission.USER_DELETE,

            // Work Order Permissions
            Permission.WORKORDER_CREATE,
            Permission.WORKORDER_READ,
            Permission.WORKORDER_UPDATE,
            Permission.WORKORDER_DELETE,
            Permission.WORKORDER_ASSIGN,

            Permission.SITE_CREATE,
            Permission.SITE_READ,
            Permission.SITE_UPDATE,
            Permission.SITE_DELETE
    )),

    DISPATCHER(Set.of(
            // Customer Permissions
            Permission.CUSTOMER_CREATE,
            Permission.CUSTOMER_READ,
            Permission.CUSTOMER_UPDATE,

            // Work Order Permissions
            Permission.WORKORDER_CREATE,
            Permission.WORKORDER_READ,
            Permission.WORKORDER_UPDATE,
            Permission.WORKORDER_ASSIGN,

            Permission.SITE_CREATE,
            Permission.SITE_READ,
            Permission.SITE_UPDATE,
            Permission.SITE_DELETE
    )),

    TECHNICIAN(Set.of(
            Permission.WORKORDER_READ,
            Permission.WORKORDER_UPDATE
    ));

    private final Set<Permission> permissions;

    Role(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public Set<GrantedAuthority> getAuthorities(){
        Set<GrantedAuthority> authorities = permissions.stream()
                .map(permission -> new SimpleGrantedAuthority(permission.name()))
                .collect(Collectors.toSet());
        authorities.add(new SimpleGrantedAuthority("ROLE_" + this.name()));
        return authorities;
    }
}