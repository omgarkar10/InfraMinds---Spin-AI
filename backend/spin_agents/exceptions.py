"""Centralized HTTP exception helpers for SPIN backend.

All domain-level errors should use these helpers instead of
bare HTTPException() calls. This ensures consistent response
structure and prevents accidental sensitive-data leakage in
error messages (e.g. raw SQL errors, stack traces).

Usage:
    from spin_agents.exceptions import not_found, unauthorized, forbidden, bad_request

    raise not_found("Grievance not found")
    raise unauthorized("Token expired")
"""
from __future__ import annotations

from fastapi import HTTPException, status


def bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def unauthorized(detail: str = "Authentication required.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden(detail: str = "Access denied.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def not_found(detail: str = "Resource not found.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def server_error(detail: str = "An internal error occurred.") -> HTTPException:
    """For user-facing 500 errors — NEVER include raw exception messages here."""
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
