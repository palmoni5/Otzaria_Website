import { AVATAR_COLORS, DEFAULT_AVATAR_COLOR, DEFAULT_INITIAL } from './color-constants'

/**
 * Generates a consistent unique color for a user based on their name
 * @param {string} name - The user's name
 * @returns {string} A hex color code
 */
export function getAvatarColor(name) {
  if (!name) return DEFAULT_AVATAR_COLOR
  
  // Calculate hash from name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Select color based on hash
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

/**
 * Gets the first character of a name for avatar display
 * @param {string} name - The user's name
 * @returns {string} The uppercase first character
 */
export function getInitial(name) {
  if (!name) return DEFAULT_INITIAL
  return name.charAt(0).toUpperCase()
}