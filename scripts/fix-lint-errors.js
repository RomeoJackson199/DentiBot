#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common replacements for 'any' types
const typeReplacements = {
  // Error handling
  'error: any': 'error: unknown',
  'catch (error: any)': 'catch (error: unknown)',
  
  // Event handlers
  'onClick?: any': 'onClick?: ClickHandler',
  'onChange?: any': 'onChange?: ChangeHandler',
  'onSubmit?: any': 'onSubmit?: SubmitHandler',
  
  // Data types
  'data: any': 'data: unknown',
  'result: any': 'result: unknown',
  'response: any': 'response: unknown',
  
  // Component props
  'props: any': 'props: BaseComponentProps',
  'children?: any': 'children?: React.ReactNode',
  
  // Form data
  'formData: any': 'formData: FormData',
  'values: any': 'values: Record<string, unknown>',
  
  // API responses
  'apiResponse: any': 'apiResponse: ApiResponse',
  'apiError: any': 'apiError: ApiError',
  
  // User data
  'user: any': 'user: User',
  'userProfile: any': 'userProfile: UserProfile',
  
  // Appointment data
  'appointment: any': 'appointment: Appointment',
  'appointments: any[]': 'appointments: Appointment[]',
  
  // Patient data
  'patient: any': 'patient: Patient',
  'patients: any[]': 'patients: Patient[]',
  
  // Dentist data
  'dentist: any': 'dentist: Dentist',
  'dentists: any[]': 'dentists: Dentist[]',
  
  // Chat data
  'message: any': 'message: ChatMessage',
  'messages: any[]': 'messages: ChatMessage[]',
  
  // Generic types
  'item: any': 'item: unknown',
  'items: any[]': 'items: unknown[]',
  'config: any': 'config: Record<string, unknown>',
  'options: any': 'options: Record<string, unknown>',
  'params: any': 'params: Record<string, unknown>',
  'metadata: any': 'metadata: Record<string, unknown>',
};

// Function to replace 'any' types in a file
function fixAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply type replacements
    for (const [pattern, replacement] of Object.entries(typeReplacements)) {
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, replacement);
        hasChanges = true;
      }
    }
    
    // Fix common error handling patterns
    content = content.replace(
      /catch\s*\(\s*error\s*:\s*any\s*\)/g,
      'catch (error: unknown)'
    );
    
    content = content.replace(
      /error\.message\s*\|\|\s*['"][^'"]*['"]/g,
      'error instanceof Error ? error.message : "Unknown error"'
    );
    
    // Fix useEffect dependencies
    content = content.replace(
      /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\},\s*\[\s*\]\s*\)/g,
      (match) => {
        // This is a complex replacement that would need more sophisticated parsing
        return match;
      }
    );
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed types in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all TypeScript files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
function main() {
  console.log('🔧 Starting lint error fixes...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findTsFiles(srcDir);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixAnyTypes(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`- Files processed: ${files.length}`);
  console.log(`- Files fixed: ${fixedCount}`);
  console.log(`- Files unchanged: ${files.length - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n✅ Lint error fixes completed!');
    console.log('💡 Run "npm run lint" to check remaining issues.');
  } else {
    console.log('\nℹ️ No files needed fixing.');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fixAnyTypes, findTsFiles };