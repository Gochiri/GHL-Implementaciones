
import { projectRepo } from './services/db.js';
import { v4 as uuidv4 } from 'uuid';
import assert from 'assert';

console.log('🧪 Starting Database Tests...');

// Mock data
const testId = uuidv4();
const testProject = {
    id: testId,
    name: 'Test Project',
    clientName: 'Test Client',
    status: 'analysis'
};

try {
    // Test Create
    console.log('1. Testing Create...');
    projectRepo.create(testProject);
    const created = projectRepo.getById(testId);
    assert.strictEqual(created.id, testId);
    assert.strictEqual(created.name, 'Test Project');
    console.log('✅ Create passed');

    // Test Update (Core Field)
    console.log('2. Testing Update (Core Field)...');
    projectRepo.updateProject(testId, { status: 'proposal' });
    const updated1 = projectRepo.getById(testId);
    assert.strictEqual(updated1.status, 'proposal');
    console.log('✅ Update Core passed');

    // Test Save Data (JSON Blob)
    console.log('3. Testing Save Data (JSON)...');
    const analysisData = { complexity: 'high', painPoints: ['slow', 'manual'] };
    projectRepo.saveData(testId, 'analysis', analysisData);
    const updated2 = projectRepo.getById(testId);
    assert.deepStrictEqual(updated2.analysis, analysisData);
    console.log('✅ Save Data passed');

    // Test Update (Mixed Fields)
    console.log('4. Testing Update (Mixed)...');
    projectRepo.updateProject(testId, {
        name: 'Renamed Project',
        quotation: { price: 1000 }
    });
    const updated3 = projectRepo.getById(testId);
    assert.strictEqual(updated3.name, 'Renamed Project');
    assert.deepStrictEqual(updated3.quotation, { price: 1000 });
    console.log('✅ Update Mixed passed');

    // Test Delete
    console.log('5. Testing Delete...');
    projectRepo.delete(testId);
    const deleted = projectRepo.getById(testId);
    assert.strictEqual(deleted, null);
    console.log('✅ Delete passed');

    console.log('🎉 All tests passed successfully!');
} catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
}
