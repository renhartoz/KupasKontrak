from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsDocumentOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "document"):
            return obj.document.owner == request.user
        if hasattr(obj, "clause"):
            return obj.clause.document.owner == request.user
        return False


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "document"):
            return obj.document.owner == request.user
        if hasattr(obj, "clause"):
            return obj.clause.document.owner == request.user
        return False


class IsTierB2B(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "tier", None) == "b2b_profesional"
        )
