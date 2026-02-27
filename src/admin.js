import { supabase } from './supabase.js';

const contentDiv = document.getElementById('content');
const adminDashboard = document.getElementById('admin-dashboard');
const logoutBtn = document.getElementById('logout-btn');
const clientsSection = document.getElementById('clients-section');
const documentsSection = document.getElementById('documents-section');
const backBtn = document.getElementById('back-btn');
const rejectionModal = document.getElementById('rejection-modal');
const rejectionNote = document.getElementById('rejection-note');
const cancelRejectionBtn = document.getElementById('cancel-rejection-btn');
const confirmRejectionBtn = document.getElementById('confirm-rejection-btn');

let currentDocumentId = null;
let currentClientId = null;
let currentClientEmail = null;

function redirectToLogin() {
  window.location.href = '/login.html';
}

function showError(message) {
  contentDiv.innerHTML = `<div class="error-message">${message}</div>`;
}

async function checkAdminAccess() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      showError('Access denied. Please log in.');
      setTimeout(redirectToLogin, 2000);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      showError('Failed to verify access permissions.');
      return;
    }

    if (!profile) {
      showError('User profile not found.');
      setTimeout(redirectToLogin, 2000);
      return;
    }

    if (profile.role !== 'admin') {
      showError('Access denied. Admin privileges required.');
      setTimeout(redirectToLogin, 2000);
      return;
    }

    contentDiv.style.display = 'none';
    adminDashboard.style.display = 'block';

    await loadClientUsers();
  } catch (error) {
    console.error('Access check error:', error);
    showError('An error occurred. Redirecting to login...');
    setTimeout(redirectToLogin, 2000);
  }
}

async function loadClientUsers() {
  const clientsList = document.getElementById('clients-list');

  try {
    const { data: clients, error } = await supabase
      .from('user_profiles')
      .select('email, role, user_id')
      .eq('role', 'client')
      .order('email');

    if (error) {
      console.error('Error loading clients:', error);
      clientsList.innerHTML = '<div class="no-clients">Error loading client users</div>';
      return;
    }

    if (!clients || clients.length === 0) {
      clientsList.innerHTML = '<div class="no-clients">No client users found</div>';
      return;
    }

    clientsList.className = 'clients-list';
    clientsList.innerHTML = clients.map(client => `
      <div class="client-item" data-user-id="${client.user_id}" data-email="${client.email}">
        <div class="client-email">${client.email}</div>
        <div class="client-badge">CLIENT</div>
      </div>
    `).join('');

    document.querySelectorAll('.client-item').forEach(item => {
      item.addEventListener('click', () => {
        const userId = item.getAttribute('data-user-id');
        const email = item.getAttribute('data-email');
        viewClientDocuments(userId, email);
      });
    });
  } catch (error) {
    console.error('Error loading clients:', error);
    clientsList.innerHTML = '<div class="no-clients">Error loading client users</div>';
  }
}

async function viewClientDocuments(userId, email) {
  currentClientId = userId;
  currentClientEmail = email;

  clientsSection.style.display = 'none';
  documentsSection.style.display = 'block';
  document.getElementById('selected-client-email').textContent = email;

  await loadClientDocuments(userId);
}

async function loadClientDocuments(userId) {
  const documentsList = document.getElementById('documents-list');
  documentsList.innerHTML = '<div class="loading">Loading documents...</div>';

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      documentsList.innerHTML = '<div class="no-documents">Error loading documents</div>';
      return;
    }

    if (!documents || documents.length === 0) {
      documentsList.innerHTML = '<div class="no-documents">No documents found</div>';
      return;
    }

    documentsList.className = 'documents-list';
    documentsList.innerHTML = documents.map(doc => {
      const date = new Date(doc.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const statusClass = `status-${doc.status}`;
      const isPending = doc.status === 'pending';

      return `
        <div class="document-item">
          <div class="document-header">
            <div>
              <div class="document-type">${doc.document_type}</div>
              <div class="document-date">${date}</div>
            </div>
            <div class="status-badge ${statusClass}">${doc.status}</div>
          </div>
          ${doc.note ? `
            <div class="document-note">
              <div class="document-note-label">Rejection Reason</div>
              <div class="document-note-text">${doc.note}</div>
            </div>
          ` : ''}
          <div class="document-actions">
            <button class="action-btn view-btn" onclick="window.open('${getDocumentUrl(doc.file_path)}', '_blank')">View Document</button>
            <button class="action-btn accept-btn" data-doc-id="${doc.id}" ${!isPending ? 'disabled' : ''}>Accept</button>
            <button class="action-btn reject-btn" data-doc-id="${doc.id}" ${!isPending ? 'disabled' : ''}>Reject</button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.getAttribute('data-doc-id');
        await updateDocumentStatus(docId, 'accepted', null);
      });
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const docId = btn.getAttribute('data-doc-id');
        openRejectionModal(docId);
      });
    });
  } catch (error) {
    console.error('Error loading documents:', error);
    documentsList.innerHTML = '<div class="no-documents">Error loading documents</div>';
  }
}

function getDocumentUrl(filePath) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${filePath}`;
}

async function updateDocumentStatus(documentId, status, note) {
  try {
    const updateData = { status };
    if (note !== null) {
      updateData.note = note;
    }

    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    if (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document status');
      return;
    }

    await loadClientDocuments(currentClientId);
  } catch (error) {
    console.error('Error updating document:', error);
    alert('Failed to update document status');
  }
}

function openRejectionModal(documentId) {
  currentDocumentId = documentId;
  rejectionNote.value = '';
  rejectionModal.style.display = 'flex';
}

function closeRejectionModal() {
  rejectionModal.style.display = 'none';
  currentDocumentId = null;
}

backBtn.addEventListener('click', () => {
  documentsSection.style.display = 'none';
  clientsSection.style.display = 'block';
  currentClientId = null;
  currentClientEmail = null;
});

cancelRejectionBtn.addEventListener('click', closeRejectionModal);

confirmRejectionBtn.addEventListener('click', async () => {
  const note = rejectionNote.value.trim();

  if (!note) {
    alert('Please provide a reason for rejection');
    return;
  }

  confirmRejectionBtn.disabled = true;
  await updateDocumentStatus(currentDocumentId, 'rejected', note);
  closeRejectionModal();
  confirmRejectionBtn.disabled = false;
});

rejectionModal.addEventListener('click', (e) => {
  if (e.target === rejectionModal) {
    closeRejectionModal();
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await supabase.auth.signOut();
    redirectToLogin();
  } catch (error) {
    console.error('Logout error:', error);
    alert('Failed to sign out');
  }
});

checkAdminAccess();
