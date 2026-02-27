import { supabase } from './supabase.js';

const contentDiv = document.getElementById('content');
const errorMessageDiv = document.getElementById('error-message');
const successMessageDiv = document.getElementById('success-message');
const dashboardDiv = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logout-btn');
const uploadForm = document.getElementById('upload-form');
const uploadBtn = document.getElementById('upload-btn');
const documentTypeSelect = document.getElementById('document-type');
const documentFileInput = document.getElementById('document-file');
const documentsContainer = document.getElementById('documents-container');

function showError(message) {
  errorMessageDiv.textContent = message;
  errorMessageDiv.classList.add('show');
  successMessageDiv.classList.remove('show');
}

function showSuccess(message) {
  successMessageDiv.textContent = message;
  successMessageDiv.classList.add('show');
  errorMessageDiv.classList.remove('show');
}

function hideMessages() {
  errorMessageDiv.classList.remove('show');
  successMessageDiv.classList.remove('show');
}

function redirectToLogin() {
  window.location.href = '/login.html';
}

function formatDocumentType(type) {
  return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function renderDocuments(documents) {
  if (documents.length === 0) {
    documentsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <p>No documents uploaded yet</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <table class="documents-table">
      <thead>
        <tr>
          <th>Document Type</th>
          <th>Status</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${documents.map(doc => `
          <tr>
            <td>${formatDocumentType(doc.document_type)}</td>
            <td><span class="status-badge status-${doc.status}">${doc.status}</span></td>
            <td>${doc.note || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  documentsContainer.innerHTML = tableHTML;
}

async function loadDocuments() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return;
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, document_type, status, note, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      documentsContainer.innerHTML = `
        <div class="empty-state">
          <p>Failed to load documents</p>
        </div>
      `;
      return;
    }

    renderDocuments(documents);
  } catch (error) {
    console.error('Error loading documents:', error);
    documentsContainer.innerHTML = `
      <div class="empty-state">
        <p>Failed to load documents</p>
      </div>
    `;
  }
}

async function checkAccess() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      redirectToLogin();
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      showError('Failed to verify access permissions');
      setTimeout(redirectToLogin, 2000);
      return;
    }

    if (!profileData || profileData.role !== 'client') {
      showError('Access denied. This page is restricted to clients only.');
      setTimeout(redirectToLogin, 2000);
      return;
    }

    contentDiv.style.display = 'none';
    dashboardDiv.style.display = 'block';
    loadDocuments();
  } catch (error) {
    console.error('Access check error:', error);
    showError('An error occurred. Redirecting to login...');
    setTimeout(redirectToLogin, 2000);
  }
}

async function handleUpload(event) {
  event.preventDefault();

  hideMessages();
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showError('You must be logged in to upload files');
      redirectToLogin();
      return;
    }

    const file = documentFileInput.files[0];
    const documentType = documentTypeSelect.value;

    if (!file || !documentType) {
      showError('Please select both a document type and a file');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      showError(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: session.user.id,
        document_type: documentType,
        file_path: filePath,
        status: 'uploaded',
        note: null
      });

    if (dbError) {
      console.error('Database error:', dbError);
      showError(`Failed to save document record: ${dbError.message}`);

      await supabase.storage
        .from('client-documents')
        .remove([filePath]);
      return;
    }

    showSuccess('Document uploaded successfully!');
    uploadForm.reset();
    loadDocuments();
  } catch (error) {
    console.error('Upload error:', error);
    showError('An unexpected error occurred during upload');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Document';
  }
}

uploadForm.addEventListener('submit', handleUpload);

logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = 'Signing out...';

  try {
    await supabase.auth.signOut();
    redirectToLogin();
  } catch (error) {
    console.error('Logout error:', error);
    showError('Failed to sign out');
    logoutBtn.disabled = false;
    logoutBtn.textContent = 'Sign Out';
  }
});

checkAccess();
