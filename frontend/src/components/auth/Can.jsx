import React from 'react';
import { useSelector } from 'react-redux';

export const Can = ({ permission, children, fallback = null }) => {
  const { permissions, isOwner } = useSelector((state) => state.organization);

  if (isOwner) {
    return <>{children}</>;
  }

  if (permission && Array.isArray(permissions) && permissions.includes(permission)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

export default Can;
