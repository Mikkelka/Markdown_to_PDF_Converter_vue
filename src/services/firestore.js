// Firestore database operations
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore'
import { db } from './firebase.js'

// Document operations
export const documentService = {
  // Get all documents for a user
  async getUserDocuments(userId) {
    if (!db) {
      throw new Error('Firestore not initialized')
    }
    
    try {
      console.log('Loading documents for user:', userId)
      
      const documentsQuery = query(
        collection(db, 'documents'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      )
      
      const snapshot = await getDocs(documentsQuery)
      const documents = {}
      
      console.log('Found', snapshot.docs.length, 'documents in Firestore')
      
      snapshot.docs.forEach(doc => {
        documents[doc.id] = {
          id: doc.id,
          ...doc.data()
        }
      })
      
      return documents
    } catch (error) {
      console.error('Failed to load documents from Firestore:', error)
      
      // If it's an index error, provide helpful message
      if (error.code === 'failed-precondition') {
        console.error('Firestore index missing. Create composite index for userId + updatedAt')
      }
      
      throw error
    }
  },

  // Save or update a document
  async saveDocument(document, userId) {
    try {
      if (document.id) {
        // Update existing document
        const docRef = doc(db, 'documents', document.id)
        await updateDoc(docRef, {
          title: document.title,
          content: document.content,
          updatedAt: document.updatedAt
        })
        return document.id
      } else {
        // Create new document
        const docData = {
          ...document,
          userId: userId
        }
        const docRef = await addDoc(collection(db, 'documents'), docData)
        return docRef.id
      }
    } catch (error) {
      console.error('Failed to save document to Firestore:', error)
      throw error
    }
  },

  // Delete a document
  async deleteDocument(documentId) {
    try {
      const docRef = doc(db, 'documents', documentId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Failed to delete document from Firestore:', error)
      throw error
    }
  }
}

// Local storage fallback operations
export const localStorageService = {
  // Get documents from localStorage
  getUserDocuments(userId) {
    try {
      const documentsKey = `markdownDocuments_${userId}`
      const saved = localStorage.getItem(documentsKey)
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return {}
    }
  },

  // Save document to localStorage
  saveDocument(document, userId) {
    try {
      const documentsKey = `markdownDocuments_${userId}`
      
      // Generate ID if needed
      if (!document.id) {
        document.id = Date.now().toString(36) + Math.random().toString(36).substr(2)
      }
      
      // Convert dates to strings for localStorage
      const localDocument = {
        ...document,
        createdAt: document.createdAt ? document.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: document.updatedAt ? document.updatedAt.toISOString() : new Date().toISOString()
      }
      
      // Load existing documents
      const existingDocs = this.getUserDocuments(userId)
      
      // Add/update document
      existingDocs[document.id] = localDocument
      
      // Save back to localStorage
      localStorage.setItem(documentsKey, JSON.stringify(existingDocs))
      
      return document.id
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      throw error
    }
  },

  // Delete document from localStorage
  deleteDocument(documentId, userId) {
    try {
      const documentsKey = `markdownDocuments_${userId}`
      const existingDocs = this.getUserDocuments(userId)
      delete existingDocs[documentId]
      localStorage.setItem(documentsKey, JSON.stringify(existingDocs))
    } catch (error) {
      console.error('Failed to delete from localStorage:', error)
      throw error
    }
  }
}