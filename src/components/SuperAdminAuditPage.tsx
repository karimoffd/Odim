import React, { useState } from 'react';
import { SuperAdminAuditModal } from './SuperAdminAuditModal';

export const SuperAdminAuditPage: React.FC = () => {
  const [selectedIndustry] = useState<string>(() => {
    return localStorage.getItem('odim_selected_industry') || 'avtosalon';
  });

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
      <SuperAdminAuditModal isFullPage={true} industry={selectedIndustry} />
    </div>
  );
};

export default SuperAdminAuditPage;
