import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DisasterAuditModule = buildModule("DisasterAuditModule", (m) => {

  const disasterAudit = m.contract("DisasterAudit");

  return {
    disasterAudit
  };
});

export default DisasterAuditModule;