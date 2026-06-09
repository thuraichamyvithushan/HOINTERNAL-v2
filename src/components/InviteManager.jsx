import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URL } from "../config";

const InviteManager = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [country, setCountry] = useState("Australia");
  const [inviteLink, setInviteLink] = useState("");
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvites = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invites`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invites");
      }

      setInvites(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const createInvite = async () => {
    if (!email) {
      toast.error("Please enter email");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          role,
          country
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create invite");
      }

      setInviteLink(data.inviteLink);
      setEmail("");
      toast.success("Invite created and email sent successfully!");
      fetchInvites();

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  const cancelInvite = async (inviteId) => {
    if (!window.confirm("Are you sure you want to cancel this invite?")) return;

    try {
      const response = await fetch(`${API_URL}/api/invites/${inviteId}/cancel`, {
        method: "PATCH"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel invite");
      }

      toast.success("Invite cancelled");
      fetchInvites();

    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <h2 className="dashboard-title">INVITE MANAGEMENT</h2>

      <div className="invite-form-box">
        <input
          type="email"
          placeholder="Enter staff email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="invite-input"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="role-select"
        >
          <option value="dealer">Dealer</option>
          <option value="representative">Representative</option>
          <option value="influencer">Influencer</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="role-select"
        >
          <option value="Australia">Australia</option>
          <option value="New Zealand">New Zealand</option>
        </select>

        <button
          className="admin-tab-btn active"
          onClick={createInvite}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Invite"}
        </button>
      </div>

      {inviteLink && (
        <div className="invite-link-box">
          <p>Invite Link:</p>
          <input value={inviteLink} readOnly className="invite-input" />
          <button className="admin-tab-btn" onClick={copyInviteLink}>
            Copy Link
          </button>
        </div>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Region</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.email}</td>
                <td>{invite.role}</td>
                <td>{invite.country}</td>
                <td>{invite.status}</td>
                <td>
                  {invite.expiresAt
                    ? new Date(invite.expiresAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  {invite.status === "pending" ? (
                    <button
                      className="delete-btn"
                      onClick={() => cancelInvite(invite.id)}
                    >
                      Cancel
                    </button>
                  ) : (
                    "No action"
                  )}
                </td>
              </tr>
            ))}

            {invites.length === 0 && (
              <tr>
                <td colSpan="6">No invites found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InviteManager;