/**
 * Data Validation Script
 * 
 * Validates that all relationships in the sample data are consistent:
 * - Parent-child relationships are bidirectional
 * - Block relationships are bidirectional  
 * - All referenced IDs exist
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Issue {
  id: string;
  key: string;
  title: string;
  type: string;
  parentId: string | null;
  childIds: string[];
  blockedBy: string[];
  blocks: string[];
  relatedTo: string[];
}

interface User {
  id: string;
  displayName: string;
}

interface Project {
  id: string;
  key: string;
  lead: string;
}

interface Sprint {
  id: string;
  name: string;
  projectId: string;
}

interface Structure {
  id: string;
  projectId: string;
  rootIssueIds: string[];
}

const dataDir = join(__dirname, '..', 'data');

function loadJSON<T>(filename: string): T {
  const content = readFileSync(join(dataDir, filename), 'utf-8');
  return JSON.parse(content);
}

function validate(): void {
  console.log('🔍 Validating sample data...\n');
  
  const issues = loadJSON<Issue[]>('issues.json');
  const users = loadJSON<User[]>('users.json');
  const projects = loadJSON<Project[]>('projects.json');
  const sprints = loadJSON<Sprint[]>('sprints.json');
  const structures = loadJSON<Structure[]>('structures.json');
  
  const issueMap = new Map(issues.map(i => [i.id, i]));
  const userIds = new Set(users.map(u => u.id));
  const projectIds = new Set(projects.map(p => p.id));
  // Note: sprintIds available for future validation
  void sprints.map(s => s.id);
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Count issue types
  const typeCounts: Record<string, number> = {};
  issues.forEach(issue => {
    typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
  });
  
  console.log('📊 Issue Type Counts:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  console.log(`   Total: ${issues.length}\n`);
  
  // Validate parent-child relationships
  console.log('🔗 Checking parent-child relationships...');
  issues.forEach(issue => {
    // If issue has parentId, parent should have this issue in childIds
    if (issue.parentId) {
      const parent = issueMap.get(issue.parentId);
      if (!parent) {
        errors.push(`${issue.key}: parentId "${issue.parentId}" does not exist`);
      } else if (!parent.childIds.includes(issue.id)) {
        errors.push(`${issue.key}: parent ${parent.key} doesn't have this issue in childIds`);
      }
    }
    
    // If issue has childIds, each child should have this issue as parentId
    issue.childIds.forEach(childId => {
      const child = issueMap.get(childId);
      if (!child) {
        errors.push(`${issue.key}: childId "${childId}" does not exist`);
      } else if (child.parentId !== issue.id) {
        errors.push(`${issue.key}: child ${child.key} doesn't have this issue as parentId`);
      }
    });
  });
  
  // Validate block relationships
  console.log('🚫 Checking block relationships...');
  issues.forEach(issue => {
    // If issue blocks another, that issue should have this in blockedBy
    issue.blocks.forEach(blockedId => {
      const blocked = issueMap.get(blockedId);
      if (!blocked) {
        errors.push(`${issue.key}: blocks "${blockedId}" does not exist`);
      } else if (!blocked.blockedBy.includes(issue.id)) {
        errors.push(`${issue.key}: blocks ${blocked.key} but ${blocked.key} doesn't have this in blockedBy`);
      }
    });
    
    // If issue is blockedBy another, that issue should have this in blocks
    issue.blockedBy.forEach(blockerId => {
      const blocker = issueMap.get(blockerId);
      if (!blocker) {
        errors.push(`${issue.key}: blockedBy "${blockerId}" does not exist`);
      } else if (!blocker.blocks.includes(issue.id)) {
        errors.push(`${issue.key}: blockedBy ${blocker.key} but ${blocker.key} doesn't have this in blocks`);
      }
    });
  });
  
  // Validate relatedTo is bidirectional
  console.log('🔄 Checking related relationships...');
  issues.forEach(issue => {
    issue.relatedTo.forEach(relatedId => {
      const related = issueMap.get(relatedId);
      if (!related) {
        errors.push(`${issue.key}: relatedTo "${relatedId}" does not exist`);
      } else if (!related.relatedTo.includes(issue.id)) {
        warnings.push(`${issue.key}: relatedTo ${related.key} but relationship is not bidirectional`);
      }
    });
  });
  
  // Validate structure references
  console.log('🏗️  Checking structure references...');
  structures.forEach(structure => {
    if (!projectIds.has(structure.projectId)) {
      errors.push(`Structure "${structure.name}": projectId "${structure.projectId}" does not exist`);
    }
    structure.rootIssueIds.forEach(issueId => {
      if (!issueMap.has(issueId)) {
        errors.push(`Structure "${structure.name}": rootIssueId "${issueId}" does not exist`);
      }
    });
  });
  
  // Validate sprint references
  console.log('🏃 Checking sprint references...');
  sprints.forEach(sprint => {
    if (!projectIds.has(sprint.projectId)) {
      errors.push(`Sprint "${sprint.name}": projectId "${sprint.projectId}" does not exist`);
    }
  });
  
  // Validate project lead references
  console.log('👤 Checking user references...');
  projects.forEach(project => {
    if (!userIds.has(project.lead)) {
      errors.push(`Project "${project.name}": lead "${project.lead}" does not exist`);
    }
  });
  
  // Print results
  console.log('\n' + '='.repeat(50));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All validations passed! Data is consistent.\n');
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} Error(s) found:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} Warning(s) found:`);
      warnings.forEach(warn => console.log(`   - ${warn}`));
    }
  }
  
  // Summary
  console.log('\n📝 Summary:');
  console.log(`   Projects: ${projects.length}`);
  console.log(`   Users: ${users.length}`);
  console.log(`   Sprints: ${sprints.length}`);
  console.log(`   Issues: ${issues.length}`);
  console.log(`   Structures: ${structures.length}`);
  
  if (errors.length > 0) {
    process.exit(1);
  }
}

validate();
