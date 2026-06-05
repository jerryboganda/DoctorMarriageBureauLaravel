import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

type Props = {
    permission?: string;
    children: ReactNode;
};

export default function PermissionGate({ permission, children }: Props) {
    const allowed = usePermission(permission);
    if (!allowed) return null;
    return <>{children}</>;
}
