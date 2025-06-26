import axios, { AxiosInstance } from 'axios'

// Types for the API
export interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  project_id: string
}

export interface Document {
  id: string
  name: string
  description: string | null
  knowledge_base_id: string
  created_at: string
  updated_at: string
  version_count?: number
  active_version_count?: number
  archived_version_count?: number
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: string
  version_name?: string
  change_description?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'archived'
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  is_archived: boolean
  archive_reason: string | null
  archived_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  file_name?: string
  source_url?: string
  file_size?: number
}

export interface KnowledgeBaseVersion {
  id: string;
  knowledge_base_id: string;
  version_number: string;
  version_name?: string;
  release_notes?: string;
  status: 'draft' | 'published' | 'archived';
  access_level: 'private' | 'protected' | 'public';
  is_primary: boolean;
  document_version_ids: string[];
  created_by: string;
  created_at: string;
  updated_at?: string;
  published_by?: string;
  published_at?: string;
  archived_by?: string;
  archived_at?: string;
}

class ApiClient {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/health')
      return true
    } catch {
      return false
    }
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await this.axiosInstance.get('/projects')
    return response.data.projects
  }

  async getProject(projectId: string): Promise<Project> {
    const response = await this.axiosInstance.get(`/projects/${projectId}`)
    return response.data
  }

  async createProject(projectData: { name: string, description: string }): Promise<Project> {
    const response = await this.axiosInstance.post('/projects', projectData)
    return response.data
  }

  // Knowledge Bases
  async getKnowledgeBases(projectId: string): Promise<KnowledgeBase[]> {
    const response = await this.axiosInstance.get(`/projects/${projectId}/knowledge-bases`)
    return response.data.knowledge_bases
  }

  async getKnowledgeBase(kbId: string): Promise<KnowledgeBase> {
    const response = await this.axiosInstance.get(`/knowledge-bases/${kbId}`)
    return response.data
  }

  async createKnowledgeBase(projectId: string, kbData: { name: string, description: string }): Promise<KnowledgeBase> {
    const response = await this.axiosInstance.post(`/projects/${projectId}/knowledge-bases`, kbData)
    return response.data
  }

  // KB Versions
  async getKnowledgeBaseVersions(kbId: string): Promise<KnowledgeBaseVersion[]> {
    const response = await this.axiosInstance.get(`/knowledge-bases/${kbId}/versions`)
    return response.data.versions
  }

  async createKbVersion(kbId: string, versionData: { version_name: string, release_notes: string, access_level: string, document_version_ids: string[] }): Promise<KnowledgeBaseVersion> {
    const response = await this.axiosInstance.post(`/knowledge-bases/${kbId}/versions`, versionData)
    return response.data
  }

  async updateKbVersion(kbId: string, versionId: string, versionData: { version_name: string, release_notes: string, access_level: string, document_version_ids: string[] }): Promise<KnowledgeBaseVersion> {
    const response = await this.axiosInstance.put(`/knowledge-bases/${kbId}/versions/${versionId}`, versionData)
    return response.data
  }

  async publishKnowledgeBaseVersion(kbId: string, versionId: string): Promise<void> {
    await this.axiosInstance.put(`/knowledge-bases/${kbId}/versions/${versionId}/publish`);
  }

  async archiveKnowledgeBaseVersion(kbId: string, versionId: string): Promise<void> {
    await this.axiosInstance.put(`/knowledge-bases/${kbId}/versions/${versionId}/archive`);
  }

  async setPrimaryKnowledgeBaseVersion(kbId: string, versionId: string): Promise<void> {
    await this.axiosInstance.put(`/knowledge-bases/${kbId}/versions/${versionId}/set-primary`);
  }

  // Documents
  async getDocuments(projectId: string): Promise<Document[]> {
    const response = await this.axiosInstance.get(`/projects/${projectId}/documents`)
    return response.data
  }

  async getAllDocumentVersions(projectId: string): Promise<DocumentVersion[]> {
    const response = await this.axiosInstance.get(`/projects/${projectId}/document-versions`)
    return response.data.document_versions
  }

  async getDocumentVersions(docId: string): Promise<DocumentVersion[]> {
    const response = await this.axiosInstance.get(`/documents/${docId}/versions`)
    return response.data.document_versions
  }

  async createDocumentFromUrl(
    kbId: string,
    url: string,
    name?: string,
    description?: string
  ): Promise<{ document_id: string; message: string }> {
    return this.axiosInstance.post('/knowledge-bases/' + kbId + '/documents/from-url', { url, name, description });
  }

  async updateDocumentDescription(docId: string, description: string): Promise<Document> {
    return this.axiosInstance.patch('/documents/' + docId + '/description', { description });
  }

  async createDocumentVersionFromUrl(documentId: string, url: string): Promise<DocumentVersion> {
    const response = await this.axiosInstance.post(`/documents/${documentId}/versions/from-url`, { url })
    return response.data
  }

  async createDocumentVersionFromFile(
    docId: string,
    file: File,
    changeDescription?: string
  ): Promise<{ version_id: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeDescription) formData.append('change_description', changeDescription);

    const url = '/api/documents/' + docId + '/versions';
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async archiveDocumentVersion(
    docId: string,
    versionId: string,
    reason: string
  ): Promise<DocumentVersion> {
    return this.axiosInstance.put(`/documents/${docId}/versions/${versionId}/archive`, { reason });
  }

  async archiveDocumentVersionWithReason(
    docId: string,
    versionId: string,
    reason: string
  ): Promise<DocumentVersion> {
    return this.archiveDocumentVersion(docId, versionId, reason);
  }

  async createDocument(kbId: string, name: string, description: string): Promise<Document> {
    return this.axiosInstance.post('/knowledge-bases/' + kbId + '/documents', { name, description });
  }

  async createDocumentVersion(
    docId: string,
    versionName?: string,
    changeDescription?: string
  ): Promise<DocumentVersion> {
    return this.axiosInstance.post('/documents/' + docId + '/versions', { version_name: versionName, change_description: changeDescription });
  }

  async getKbVersions(kbId: string): Promise<KnowledgeBaseVersion[]> {
    const data = await this.axiosInstance.get('/knowledge-bases/' + kbId + '/versions');
    return data.data.versions;
  }

  // KB Version Documents
  async getKbVersionDocuments(versionId: string): Promise<any[]> {
    const response = await this.axiosInstance.get('/kb-versions/' + versionId + '/documents');
    return response.data;
  }

  // Individual Document and Document Version
  async getDocument(docId: string): Promise<Document> {
    const response = await this.axiosInstance.get('/documents/' + docId);
    return response.data;
  }

  async getDocumentVersion(versionId: string): Promise<DocumentVersion> {
    const response = await this.axiosInstance.get('/document-versions/' + versionId);
    return response.data;
  }

  async getDocumentsByKb(kbId: string): Promise<Document[]> {
    const response = await this.axiosInstance.get(`/knowledge-bases/${kbId}/documents`)
    return response.data.documents
  }

  async deleteDocumentVersion(docId: string, versionId: string): Promise<void> {
    await this.axiosInstance.delete(`/documents/${docId}/versions/${versionId}`)
  }
}

export const apiClient = new ApiClient() 