// Simple test script for coach insights functionality
import { getCoachInsights, getSingleInsight } from './server/coach-insights.ts';

async function testCoachInsights() {
  console.log('🧠 Testing Coach Insights System...');
  
  try {
    // Test with a demo user ID
    const userId = 1;
    const options = { count: 5, includeAI: false, coachName: 'Titan' };
    
    console.log('📋 Testing getCoachInsights...');
    const insights = await getCoachInsights(userId, options);
    
    console.log('✅ Generated insights:', insights.length);
    insights.forEach((insight, idx) => {
      console.log(`${idx + 1}. [${insight.category}] ${insight.message}`);
      console.log(`   Action: ${insight.action} (${insight.actionLabel})`);
      console.log(`   Priority: ${insight.priority}`);
    });
    
    console.log('\n📋 Testing getSingleInsight...');
    const singleInsight = await getSingleInsight(userId, 0, 'Titan');
    console.log('✅ Single insight:', singleInsight.message);
    console.log('   Action:', singleInsight.action, '(' + singleInsight.actionLabel + ')');
    
    console.log('\n🎉 Coach Insights System Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCoachInsights();