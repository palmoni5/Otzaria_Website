export const statusConfig = {
  completed: {
    label: 'הושלם',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: 'check_circle'
  },
  'in-progress': {
    label: 'בטיפול',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: 'edit'
  },
  available: {
    label: 'זמין לעריכה',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: 'description'
  }
}

// פונקציה לחיפוש בעץ
export function searchInTree(tree, searchTerm) {
  if (!searchTerm) return tree
  
  const results = []
  
  function search(items, path = []) {
    items.forEach(item => {
      const currentPath = [...path, item.name]
      
      if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({ ...item, path: currentPath })
      }
      
      if (item.children) {
        search(item.children, currentPath)
      }
    })
  }
  
  search(tree)
  return results
}