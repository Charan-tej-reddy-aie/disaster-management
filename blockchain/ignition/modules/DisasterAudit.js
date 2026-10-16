import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DisasterAuditModule", (m) => {
    const disasterAudit = m.contract("DisasterAudit");

    return { disasterAudit };
});