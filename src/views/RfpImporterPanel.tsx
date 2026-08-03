import React, { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileImport,
  faRotateRight,
  faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";
import "./RfpImporterPanel.css";
import {
  Estimate,
  WorkflowState,
  getEstimates,
  isRfpImporterConfigured,
  workflowStateColorClass,
  workflowStateLabel
} from "../helper/RfpImporterClient";
import ImportRfpModal from "../modals/ImportRfpModal";

// Workflow states shown by default — these are the actionable ones
const DEFAULT_STATE_FILTER: WorkflowState[] = [
  "docs_received",
  "awaiting_portal_docs",
  "analyzed",
  "needs_review"
];

const ALL_STATES: WorkflowState[] = [
  "logged",
  "folder_created",
  "docs_received",
  "awaiting_portal_docs",
  "analyzed",
  "rfi_drafted",
  "sent_to_estimating",
  "complete",
  "needs_review"
];

interface RfpImporterPanelProps {
  /** Called after a successful import so the parent can refresh its bid list */
  onImportSuccess?: () => void;
}

const RfpImporterPanel: React.FC<RfpImporterPanelProps> = ({
  onImportSuccess
}) => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<"default" | "all">("default");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null
  );
  const [showImportModal, setShowImportModal] = useState(false);

  const configured = isRfpImporterConfigured();

  const fetchEstimates = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      let results: Estimate[];
      if (stateFilter === "default") {
        // PostgREST supports in() for multi-value filter
        const stateList = DEFAULT_STATE_FILTER.join(",");
        results = await getEstimates({
          workflow_state: `in.(${stateList})`,
          order: "due_date.asc.nullslast"
        });
      } else {
        results = await getEstimates({ order: "due_date.asc.nullslast" });
      }
      setEstimates(results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load RFP pipeline data."
      );
    } finally {
      setLoading(false);
    }
  }, [configured, stateFilter]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const handleImportClick = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setShowImportModal(true);
  };

  const handleImportSuccess = () => {
    setShowImportModal(false);
    setSelectedEstimate(null);
    onImportSuccess?.();
  };

  // ─── Not configured ────────────────────────────────────────────────────────
  if (!configured) {
    return (
      <div className="rfp-panel">
        <div className="rfp-panel-header">
          <h6 className="rfp-panel-title">
            <FontAwesomeIcon icon={faFileImport} />
            RFP Pipeline
          </h6>
        </div>
        <div className="rfp-panel-unconfigured">
          <p>
            Set <code>VITE_POSTGREST_URL</code> and{" "}
            <code>VITE_POSTGREST_JWT</code> in your <code>.env</code> file to
            connect to the RFP-Importer pipeline.
          </p>
        </div>
      </div>
    );
  }

  // ─── Configured ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="rfp-panel">
        {/* Header */}
        <div className="rfp-panel-header">
          <h6 className="rfp-panel-title">
            <FontAwesomeIcon icon={faFileImport} />
            RFP Pipeline
          </h6>
          <div className="rfp-panel-controls">
            <span className="rfp-panel-filter-label">Show:</span>
            <select
              className="rfp-panel-select"
              value={stateFilter}
              onChange={(e) =>
                setStateFilter(e.target.value as "default" | "all")
              }
            >
              <option value="default">Actionable</option>
              <option value="all">All States</option>
            </select>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={fetchEstimates}
              disabled={loading}
              title="Refresh"
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FontAwesomeIcon icon={faRotateRight} />
              )}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="rfp-panel-error">{error}</div>}

        {/* Table */}
        {!error && (
          <div className="rfp-table-wrapper">
            {loading && estimates.length === 0 ? (
              <div className="rfp-panel-empty">
                <Spinner animation="border" size="sm" /> Loading pipeline…
              </div>
            ) : estimates.length === 0 ? (
              <div className="rfp-panel-empty">
                No estimates match the current filter.
              </div>
            ) : (
              <table className="rfp-table">
                <thead>
                  <tr>
                    <th>Estimate #</th>
                    <th>Client</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th>State</th>
                    <th>Status</th>
                    <th>Estimator</th>
                    <th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((est) => (
                    <tr key={est.id}>
                      <td>
                        <span className="rfp-estimate-number">
                          {est.estimate_number}
                        </span>
                      </td>
                      <td>{est.client}</td>
                      <td>
                        <div
                          style={{
                            maxWidth: 240,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                          title={est.project_name}
                        >
                          {est.project_name}
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {est.due_date
                          ? new Date(est.due_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`rfp-badge ${workflowStateColorClass(est.workflow_state)}`}
                        >
                          {workflowStateLabel(est.workflow_state)}
                        </span>
                      </td>
                      <td>{est.status}</td>
                      <td>{est.estimator ?? "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {est.sharepoint_url && (
                            <a
                              href={est.sharepoint_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open SharePoint folder"
                              style={{ color: "#555" }}
                            >
                              <FontAwesomeIcon
                                icon={faExternalLinkAlt}
                                size="sm"
                              />
                            </a>
                          )}
                          <Button
                            size="sm"
                            className="upload-button rfp-import-btn"
                            onClick={() => handleImportClick(est)}
                          >
                            Import
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Import modal */}
      {selectedEstimate && (
        <ImportRfpModal
          show={showImportModal}
          estimate={selectedEstimate}
          onHide={() => {
            setShowImportModal(false);
            setSelectedEstimate(null);
          }}
          onSuccess={handleImportSuccess}
        />
      )}
    </>
  );
};

export default RfpImporterPanel;
