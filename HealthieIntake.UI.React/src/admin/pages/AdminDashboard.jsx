import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import IntakeModal from '../components/IntakeModal';
import { API_BASE_URL } from '../../config';

function AdminDashboard() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Fetch intakes from API
  useEffect(() => {
    fetchIntakes();
  }, []);

  const fetchIntakes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/intake/list`);
      // API returns { total_count, returned_count, intakes }
      setIntakes(response.data.intakes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching intakes:', err);
      setError('Failed to load intake forms');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login');
  };

  const handleViewIntake = async (intake) => {
    // If we only have basic info, fetch full details
    if (intake.id && !intake.form_data) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/intake/${intake.id}`);
        setSelectedIntake(response.data);
      } catch (err) {
        console.error('Error fetching intake details:', err);
        setError('Failed to load intake details');
      }
    } else {
      setSelectedIntake(intake);
    }
  };

  const handleDeleteIntake = async (intake, e) => {
    e.stopPropagation();

    // Confirmation dialog
    const patientName = `${intake.first_name} ${intake.last_name}`;
    const confirmMessage = `Are you sure you want to delete the intake form for ${patientName}?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/intake/${intake.id}`);

      // Refresh the list after successful deletion
      await fetchIntakes();

      // Show success message
      alert(`Intake form for ${patientName} has been deleted successfully.`);
    } catch (err) {
      console.error('Error deleting intake:', err);
      setError('Failed to delete intake form');
      alert('Failed to delete intake form. Please try again.');
    }
  };

  // Filter intakes based on search and status
  const filteredIntakes = intakes.filter(intake => {
    const matchesSearch =
      !searchTerm ||
      intake.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intake.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intake.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intake.patient_healthie_id?.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' ||
      intake.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{
      width: '80%',
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '40px',
      marginTop: '30px',
      marginBottom: '30px',
      backgroundColor: 'var(--override-white, #FFFFFF)',
      borderRadius: '20px',
      boxShadow: '0 4px 20px rgba(5, 0, 56, 0.08)'
    }}
    className="admin-dashboard-container">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-md-between mb-4 gap-3 text-center text-md-start">
        <img
          src="https://i0.wp.com/override.health/wp-content/uploads/2025/08/Override-Logo_Full-Color-e1757963862728.png?w=2860&ssl=1"
          alt="Override Health"
          className="header-logo-mobile"
          style={{ height: '60px' }}
        />
        <div className="d-flex align-items-center gap-3">
          <h1 className="mb-0 h3">Intake Forms Dashboard</h1>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleLogout}
            style={{ whiteSpace: 'nowrap' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4 align-items-center">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, or patient ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ height: '48px' }}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: '48px' }}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-outline-primary w-100" onClick={fetchIntakes} style={{ height: '48px' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="row mb-2">
            <div className="col">
              <p className="text-muted">
                Showing {filteredIntakes.length} of {intakes.length} intake forms
              </p>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Patient ID</th>
                      <th>Patient Name</th>
                      <th>Email</th>
                      <th>DOB</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIntakes.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No intake forms found
                        </td>
                      </tr>
                    ) : (
                      filteredIntakes.map((intake) => (
                        <tr
                          key={intake.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleViewIntake(intake)}
                        >
                          <td>{intake.patient_healthie_id}</td>
                          <td>{intake.first_name} {intake.last_name}</td>
                          <td>{intake.email}</td>
                          <td>{intake.date_of_birth}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: intake.status === 'completed' ? '#1CB783' : '#ffc107',
                                color: intake.status === 'completed' ? 'white' : '#000',
                                textTransform: 'capitalize'
                              }}
                            >
                              {intake.status}
                            </span>
                          </td>
                          <td>
                            {intake.last_updated_at ?
                              new Date(intake.last_updated_at).toLocaleString() :
                              'N/A'
                            }
                          </td>
                          <td>
                            {intake.submitted_at ?
                              new Date(intake.submitted_at).toLocaleString() :
                              'N/A'
                            }
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewIntake(intake);
                                }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => handleDeleteIntake(intake, e)}
                                title="Delete this intake form"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for viewing intake */}
      {selectedIntake && (
        <IntakeModal
          intake={selectedIntake}
          onClose={() => setSelectedIntake(null)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
