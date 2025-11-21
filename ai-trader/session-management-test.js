// Test file for session management functionality
// This file can be used to test the session management features

console.log('🧪 Session Management Test Suite');

// Test functions that can be run in the browser console when the extension is loaded
async function testSessionManagement() {
  console.log('🚀 Starting session management tests...');
  
  try {
    // Test 1: Get current session stats
    console.log('📊 Test 1: Getting session statistics');
    const stats = await window.getSessionStats();
    console.log('Stats result:', stats);
    
    // Test 2: Load today's sessions
    console.log('📖 Test 2: Loading today\'s sessions');
    const sessions = await window.loadSessions();
    console.log('Sessions loaded:', sessions.length);
    
    // Test 3: Test clearing cache (use with caution!)
    // console.log('🧹 Test 3: Clearing today\'s cache');
    // await window.clearTodaysCache();
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export test function to window for console access
window.testSessionManagement = testSessionManagement;

console.log('🔧 Available test commands:');
console.log('  testSessionManagement() - Run full test suite');
console.log('  clearTodaysCache() - Clear all today\'s sessions');
console.log('  getSessionStats() - Get session statistics');
console.log('  loadSessions() - Load today\'s sessions');