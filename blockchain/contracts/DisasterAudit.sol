// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DisasterAudit {

    struct AuditRecord {
        uint256 recordId;
        string eventType;
        string referenceId;
        bytes32 dataHash;
        uint256 timestamp;
        address recordedBy;
    }

    uint256 private nextRecordId = 1;

    mapping(uint256 => AuditRecord) private auditRecords;

    event AuditRecorded(
        uint256 indexed recordId,
        string eventType,
        string referenceId,
        bytes32 dataHash,
        uint256 timestamp,
        address recordedBy
    );

    function recordAudit(
        string memory eventType,
        string memory referenceId,
        bytes32 dataHash
    ) external returns (uint256) {

        uint256 recordId = nextRecordId;

        auditRecords[recordId] = AuditRecord({
            recordId: recordId,
            eventType: eventType,
            referenceId: referenceId,
            dataHash: dataHash,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        });

        nextRecordId++;

        emit AuditRecorded(
            recordId,
            eventType,
            referenceId,
            dataHash,
            block.timestamp,
            msg.sender
        );

        return recordId;
    }

    function getAudit(uint256 recordId)
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            bytes32,
            uint256,
            address
        )
    {
        AuditRecord memory record = auditRecords[recordId];

        return (
            record.recordId,
            record.eventType,
            record.referenceId,
            record.dataHash,
            record.timestamp,
            record.recordedBy
        );
    }
}