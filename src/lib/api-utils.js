/**
 * Utility functions for making API calls with consistent error handling
 */

/**
 * Base fetch wrapper with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`API Error at ${url}:`, error)
    throw error
  }
}

/**
 * GET request helper
 * @param {string} url - API endpoint
 * @returns {Promise<Object>} Response data
 */
export async function apiGet(url) {
  return apiCall(url, { method: 'GET' })
}

/**
 * POST request helper
 * @param {string} url - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Response data
 */
export async function apiPost(url, body) {
  return apiCall(url, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * PUT request helper
 * @param {string} url - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Response data
 */
export async function apiPut(url, body) {
  return apiCall(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

/**
 * DELETE request helper
 * @param {string} url - API endpoint
 * @returns {Promise<Object>} Response data
 */
export async function apiDelete(url) {
  return apiCall(url, { method: 'DELETE' })
}

/**
 * Upload file to API
 * @param {string} url - API endpoint
 * @param {FormData} formData - Form data with file
 * @returns {Promise<Object>} Response data
 */
export async function apiUpload(url, formData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
      // Note: Don't set Content-Type header for FormData, browser will set it
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Upload Error: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`Upload Error at ${url}:`, error)
    throw error
  }
}
