import { useSelector } from 'react-redux';

export const usePermission = (requiredPermission = null) => {
  const { permissions, isOwner, activeRole, activeOrg } = useSelector((state) => state.organization);

  const hasPermission = (permissionKey) => {
    if (isOwner) return true;
    if (!permissions || !Array.isArray(permissions)) return false;
    return permissions.includes(permissionKey);
  };

  const allowed = requiredPermission ? hasPermission(requiredPermission) : true;

  return {
    hasPermission,
    allowed,
    isOwner,
    role: activeRole,
    organization: activeOrg,
    permissions
  };
};

export default usePermission;
