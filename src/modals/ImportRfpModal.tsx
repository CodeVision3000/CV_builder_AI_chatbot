import React, { useContext, useMemo, useRef, useState } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import { useAuthUser } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import {
  Estimate,
  getAnalysis,
  logEvent
} from "../helper/RfpImporterClient";
import { BidContext } from "../views/BidWritingStateManagerView";
import { displayAlert } from "../helper/Alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileImport,
  faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";
import "./ImportRfpModal.css";

interface ImportRfpModalProps {
  show: boolean;
  estimate: Estimate;
  onHide: () => void;
  onSuccess: () => void;
}

/**
 * Maps an RFP-Importer estimate to the fields expected by the CV Builder
 * `/upload_bids` endpoint and BidWritingStateManagerView shared state.
 */
function mapEstimateToBidFields(estimate: Estimate) {
  return {
    bid_title: estimate.project_name,
    client_name: estimate.client,
    submission_deadline: estimate.due_date ?? "",
    value: estimate.submitted_proposed_value ?? "",
    bid_manager: estimate.estimator ?? "",
    opportunity_information: estimate.scope_of_work ?? "",
    // Extra metadata stored for back-reference
    rfp_estimate_id: estimate.id,
    rfp_estimate_number: estimate.estimate_number,
    rfp_sharepoint_url: estimate.sharepoint_url ?? ""
  };
}

const ImportRfpModal: React.FC<ImportRfpModalProps> = ({
  show,
  estimate,
  onHide,
  onSuccess
}) => {
  const getAuth = useAuthUser();
  const auth = useMemo(() => getAuth(), [getAuth]);
  const tokenRef = useRef(auth?.token || "default");
  const navigate = useNavigate();
  const { setSharedState } = useContext(BidContext);

  const mapped = mapEstimateToBidFields(estimate);

  // Allow the user to adjust the bid title before importing
  const [bidTitle, setBidTitle] = useState(mapped.bid_title);
  const [importing, setImporting] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidTitle.trim()) {
      displayAlert("Please enter a bid title.", "warning");
      return;
    }

    setImporting(true);
    try {
      // 1. Fetch the latest AI analysis for richer opportunity_information
      let opportunityInfo = mapped.opportunity_information;
      try {
        const analysis = await getAnalysis(estimate.id);
        if (analysis?.scope_summary) {
          opportunityInfo = analysis.scope_summary;
        }
      } catch {
        // Analysis fetch is best-effort; fall back to scope_of_work
      }

      // 2. Create the bid in CV Builder via upload_bids
      const formData = new FormData();
      formData.append("bid_title", bidTitle.trim());
      formData.append("status", "ongoing");
      formData.append("client_name", mapped.client_name);
      formData.append("submission_deadline", mapped.submission_deadline);
      formData.append("value", mapped.value);
      formData.append("bid_manager", mapped.bid_manager);
      formData.append("opportunity_information", opportunityInfo);
      formData.append("compliance_requirements", " ");
      formData.append("contract_information", opportunityInfo);
      formData.append("questions", " ");
      formData.append("original_creator", auth?.email ?? "");
      formData.append(
        "contributors",
        JSON.stringify(auth?.email ? { [auth.email]: "admin" } : {})
      );
      formData.append("outline", JSON.stringify([]));

      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/upload_bids`,
        formData,
        {
          headers: {
            Authorization: "Bearer " + tokenRef.current,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const { bid_id } = response.data;

      // 3. Write an audit event back to RFP-Importer
      try {
        await logEvent(
          estimate.id,
          "companion_import",
          `Imported into mytender.io as bid "${bidTitle.trim()}" (id: ${bid_id})`
        );
      } catch {
        // Audit-log failure is non-fatal
      }

      // 4. Seed the BidContext shared state and navigate to the bid
      const bidData = {
        _id: bid_id,
        bid_title: bidTitle.trim(),
        client_name: mapped.client_name,
        submission_deadline: mapped.submission_deadline,
        value: mapped.value,
        bid_manager: mapped.bid_manager,
        opportunity_information: opportunityInfo,
        compliance_requirements: "",
        questions: "",
        opportunity_owner: "",
        bid_qualification_result: "",
        original_creator: auth?.email ?? "",
        contributors: auth?.email ? { [auth.email]: "admin" } : {},
        outline: []
      };

      setSharedState((prev) => ({
        ...prev,
        bidInfo: bidTitle.trim(),
        client_name: mapped.client_name,
        submission_deadline: mapped.submission_deadline,
        value: mapped.value,
        bid_manager: mapped.bid_manager,
        opportunity_information: opportunityInfo,
        compliance_requirements: "",
        questions: "",
        opportunity_owner: "",
        bid_qualification_result: "",
        original_creator: auth?.email ?? "",
        contributors: auth?.email ? { [auth.email]: "admin" } : {},
        object_id: bid_id,
        outline: [],
        isSaved: true,
        isLoading: false,
        saveSuccess: true
      }));

      localStorage.setItem("navigatedFromBidsTable", "true");
      localStorage.removeItem("bidState");

      displayAlert("RFP imported successfully!", "success");
      onSuccess();

      navigate("/bid-extractor", {
        state: { bid: bidData, fromBidsTable: true }
      });
    } catch (err) {
      console.error("Import failed:", err);
      displayAlert("Failed to import RFP. Please try again.", "danger");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="py-3 px-4">
        <Modal.Title style={{ fontWeight: 700, fontSize: 18 }}>
          <FontAwesomeIcon
            icon={faFileImport}
            style={{ marginRight: 8, color: "#f9a01b" }}
          />
          Import RFP into Tender Dashboard
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleImport}>
        <Modal.Body className="px-4 py-3">
          {/* Estimate identity */}
          <div className="rfp-import-meta mb-3">
            <span className="rfp-import-meta-number">
              {estimate.estimate_number}
            </span>
            {estimate.sharepoint_url && (
              <a
                href={estimate.sharepoint_url}
                target="_blank"
                rel="noreferrer"
                className="rfp-import-meta-sp"
                title="Open SharePoint folder"
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" />{" "}
                SharePoint
              </a>
            )}
          </div>

          {/* Editable bid title */}
          <Form.Group className="mb-3">
            <Form.Label className="rfp-import-label">
              Bid Title <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={bidTitle}
              onChange={(e) => setBidTitle(e.target.value)}
              placeholder="Enter bid title"
              required
            />
          </Form.Group>

          {/* Read-only preview of mapped fields */}
          <div className="rfp-import-preview">
            <h6 className="rfp-import-preview-title">Pre-filled from RFP pipeline</h6>
            <div className="rfp-import-grid">
              <PreviewRow label="Client" value={mapped.client_name} />
              <PreviewRow
                label="Due Date"
                value={
                  mapped.submission_deadline
                    ? new Date(mapped.submission_deadline).toLocaleDateString()
                    : "—"
                }
              />
              <PreviewRow
                label="Value"
                value={mapped.value || "—"}
              />
              <PreviewRow
                label="Estimator → Bid Manager"
                value={mapped.bid_manager || "—"}
              />
              <PreviewRow
                label="Scope / Opportunity Info"
                value={mapped.opportunity_information || "—"}
                multiline
              />
              {estimate.sharepoint_url && (
                <PreviewRow
                  label="SharePoint Folder"
                  value={estimate.folder_name ?? estimate.sharepoint_url}
                />
              )}
            </div>
          </div>

          <p className="rfp-import-note">
            An audit event will be written back to the RFP pipeline confirming
            this import.
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={importing}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="upload-button"
            disabled={importing || !bidTitle.trim()}
          >
            {importing ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  style={{ marginRight: 6 }}
                />
                Importing…
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faFileImport}
                  style={{ marginRight: 6 }}
                />
                Import
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// ─── Helper sub-component ─────────────────────────────────────────────────────

interface PreviewRowProps {
  label: string;
  value: string;
  multiline?: boolean;
}

const PreviewRow: React.FC<PreviewRowProps> = ({ label, value, multiline }) => (
  <div className="rfp-import-row">
    <span className="rfp-import-row-label">{label}</span>
    {multiline ? (
      <span
        className="rfp-import-row-value rfp-import-row-multiline"
        title={value}
      >
        {value}
      </span>
    ) : (
      <span className="rfp-import-row-value">{value}</span>
    )}
  </div>
);

export default ImportRfpModal;
