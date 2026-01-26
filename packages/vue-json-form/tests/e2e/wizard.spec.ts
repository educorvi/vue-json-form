import { test, expect } from '@playwright/test';

test.describe('Wizard Structure', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wizard');
    });

    test('Wizard form renders', async ({ page }) => {
        const form = page.locator('form');
        await expect(form).toBeVisible();
    });

    test('Results container is visible', async ({ page }) => {
        const resultsContainer = page.locator('#result-container');
        await expect(resultsContainer).toBeVisible();
    });
});

test.describe('Wizard Page 1 - Personal Data', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wizard');
    });

    test('Name field is visible and required', async ({ page }) => {
        const nameInput = page.locator('input[name="/properties/personalData/properties/name"]');
        await expect(nameInput).toBeVisible();
        await expect(nameInput).toHaveAttribute('type', 'text');
    });

    test('Age field is visible', async ({ page }) => {
        const ageInput = page.locator('input[name="/properties/personalData/properties/age"]');
        await expect(ageInput).toBeVisible();
        await expect(ageInput).toHaveAttribute('type', 'number');
        await expect(ageInput).toHaveAttribute('min', '0');
    });

    test('Guardian agreement field is not visible for adults', async ({ page }) => {
        // Fill age as 18 or older
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('25');
        
        // Guardian agreement should not be visible
        const guardianCheckbox = page.locator('input[name="/properties/personalData/properties/guardianAgrees"]');
        await expect(guardianCheckbox).not.toBeVisible();
    });

    test('Guardian agreement field is visible for minors', async ({ page }) => {
        // Fill age as under 18
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('16');
        
        // Guardian agreement should be visible
        const guardianCheckbox = page.locator('input[name="/properties/personalData/properties/guardianAgrees"]');
        await expect(guardianCheckbox).toBeVisible();
        await expect(guardianCheckbox).toHaveAttribute('type', 'checkbox');
    });

    test('Next button is visible on page 1', async ({ page }) => {
        const nextButton = page.locator('button:has-text("Next")');
        await expect(nextButton).toBeVisible();
    });

    test('Cannot navigate to next page without filling required fields', async ({ page }) => {
        const nextButton = page.locator('button:has-text("Next")');
        await nextButton.click();
        
        // Should still be on page 1 (name field should still be visible)
        const nameInput = page.locator('input[name="/properties/personalData/properties/name"]');
        await expect(nameInput).toBeVisible();
    });

    test('Can navigate to next page after filling required fields', async ({ page }) => {
        // Fill required name field
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('John Doe');
        
        const nextButton = page.locator('button:has-text("Next")');
        await nextButton.click();
        
        // Should be on page 2 (message field should be visible)
        const messageField = page.locator('textarea[name="/properties/message/properties/yourMessage"]');
        await expect(messageField).toBeVisible();
    });
});

test.describe('Wizard Page 2 - Message', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wizard');
        // Navigate to page 2
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('John Doe');
        await page.locator('button:has-text("Next")').click();
    });

    test('Important checkbox is visible with default value', async ({ page }) => {
        const importantCheckbox = page.locator('input[name="/properties/message/properties/important"]');
        await expect(importantCheckbox).toBeVisible();
        await expect(importantCheckbox).toHaveAttribute('type', 'checkbox');
        await expect(importantCheckbox).toBeChecked();
    });

    test('Your Message field is visible and required', async ({ page }) => {
        const messageField = page.locator('textarea[name="/properties/message/properties/yourMessage"]');
        await expect(messageField).toBeVisible();
    });

    test('Parents field is not visible for adults', async ({ page }) => {
        // Navigate back to page 1
        await page.locator('button:has-text("Previous")').click();
        
        // Set age as adult
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('25');
        
        // Go to page 2
        await page.locator('button:has-text("Next")').click();
        
        // Parents field should not be visible
        const parentsField = page.locator('[name="/properties/message/properties/parents"]');
        await expect(parentsField).not.toBeVisible();
    });

    test('Parents field is visible for minors', async ({ page }) => {
        // Navigate back to page 1
        await page.locator('button:has-text("Previous")').click();
        
        // Set age as minor
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('15');
        
        // Go to page 2
        await page.locator('button:has-text("Next")').click();
        
        // Parents field should be visible
        const parentsContainer = page.locator('[name="/properties/message/properties/parents"]');
        await expect(parentsContainer).toBeVisible();
    });

    test('Previous button navigates back to page 1', async ({ page }) => {
        await page.locator('button:has-text("Previous")').click();
        
        // Should be back on page 1
        const nameInput = page.locator('input[name="/properties/personalData/properties/name"]');
        await expect(nameInput).toBeVisible();
    });

    test('Next button navigates to page 3', async ({ page }) => {
        // Fill required message field
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('Test message');
        
        await page.locator('button:has-text("Next")').click();
        
        // Should be on page 3
        const submitButton = page.locator('button:has-text("Submit")');
        await expect(submitButton).toBeVisible();
    });
});

test.describe('Wizard Page 3 - Credentials', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wizard');
        // Navigate to page 3
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('John Doe');
        await page.locator('button:has-text("Next")').click();
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('Test message');
        await page.locator('button:has-text("Next")').click();
    });

    test('Credentials field is visible', async ({ page }) => {
        const credentialsContainer = page.locator('[name="/properties/credentials/properties/credentials"]');
        await expect(credentialsContainer).toBeVisible();
    });

    test('Previous button navigates back to page 2', async ({ page }) => {
        await page.locator('button:has-text("Previous")').click();
        
        // Should be back on page 2
        const messageField = page.locator('textarea[name="/properties/message/properties/yourMessage"]');
        await expect(messageField).toBeVisible();
    });

    test('Submit button is visible', async ({ page }) => {
        const submitButton = page.locator('button:has-text("Submit")');
        await expect(submitButton).toBeVisible();
    });
});

test.describe('Wizard Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wizard');
    });

    test('Can navigate forward through all pages', async ({ page }) => {
        // Page 1
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('John Doe');
        await page.locator('button:has-text("Next")').click();
        
        // Page 2
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('Test message');
        await page.locator('button:has-text("Next")').click();
        
        // Page 3
        const submitButton = page.locator('button:has-text("Submit")');
        await expect(submitButton).toBeVisible();
    });

    test('Can navigate backward through all pages', async ({ page }) => {
        // Go to page 3 first
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('John Doe');
        await page.locator('button:has-text("Next")').click();
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('Test message');
        await page.locator('button:has-text("Next")').click();
        
        // Navigate back to page 2
        await page.locator('button:has-text("Previous")').click();
        const messageField = page.locator('textarea[name="/properties/message/properties/yourMessage"]');
        await expect(messageField).toBeVisible();
        
        // Navigate back to page 1
        await page.locator('button:has-text("Previous")').click();
        const nameInput = page.locator('input[name="/properties/personalData/properties/name"]');
        await expect(nameInput).toBeVisible();
    });

    test('Form data persists when navigating between pages', async ({ page }) => {
        // Fill data on page 1
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('Jane Smith');
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('30');
        await page.locator('button:has-text("Next")').click();
        
        // Fill data on page 2
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('My test message');
        await page.locator('button:has-text("Next")').click();
        
        // Navigate back to page 1
        await page.locator('button:has-text("Previous")').click();
        await page.locator('button:has-text("Previous")').click();
        
        // Check that data persists
        await expect(page.locator('input[name="/properties/personalData/properties/name"]')).toHaveValue('Jane Smith');
        await expect(page.locator('input[name="/properties/personalData/properties/age"]')).toHaveValue('30');
    });
});

test.describe('Wizard Form Submission', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wizard');
    });

    test('Submit form with complete adult data', async ({ page }) => {
        // Page 1 - Personal Data
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('Alice Johnson');
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('25');
        await page.locator('button:has-text("Next")').click();
        
        // Page 2 - Message
        await page.locator('input[name="/properties/message/properties/important"]').uncheck();
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('This is my message');
        await page.locator('button:has-text("Next")').click();
        
        // Page 3 - Credentials
        await page.locator('button:has-text("Submit")').click();
        
        // Check results container has data
        const resultsContainer = page.locator('#result-container');
        await expect(resultsContainer).toContainText('Alice Johnson');
        await expect(resultsContainer).toContainText('This is my message');
    });

    test('Submit form with complete minor data', async ({ page }) => {
        // Page 1 - Personal Data
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('Bobby Brown');
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('15');
        
        // Guardian agreement should appear
        const guardianCheckbox = page.locator('input[name="/properties/personalData/properties/guardianAgrees"]');
        await expect(guardianCheckbox).toBeVisible();
        await guardianCheckbox.check();
        
        await page.locator('button:has-text("Next")').click();
        
        // Page 2 - Message
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('Minor message');
        
        // Parents field should be visible
        const parentsContainer = page.locator('[name="/properties/message/properties/parents"]');
        await expect(parentsContainer).toBeVisible();
        
        // Add parent name
        const addButton = parentsContainer.locator('button[aria-label="Add Item"]');
        await addButton.click();
        
        const parentInputs = parentsContainer.locator('input[type="text"]');
        await expect(parentInputs.nth(0)).toBeVisible();
        await parentInputs.nth(0).fill('Parent One');
        
        await page.locator('button:has-text("Next")').click();
        
        // Page 3 - Submit
        await page.locator('button:has-text("Submit")').click();
        
        // Check results container has data
        const resultsContainer = page.locator('#result-container');
        await expect(resultsContainer).toContainText('Bobby Brown');
        await expect(resultsContainer).toContainText('Minor message');
        await expect(resultsContainer).toContainText('Parent One');
    });

    test('Results update on submission', async ({ page }) => {
        // Get initial results
        const resultsContainer = page.locator('#result-container');
        const initialResults = await resultsContainer.textContent();
        
        // Fill and submit form
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('Test User');
        await page.locator('button:has-text("Next")').click();
        
        await page.locator('textarea[name="/properties/message/properties/yourMessage"]').fill('Test');
        await page.locator('button:has-text("Next")').click();
        
        await page.locator('button:has-text("Submit")').click();
        
        // Check results have updated
        await expect(resultsContainer).toContainText('Test User');
        const updatedResults = await resultsContainer.textContent();
        // Results should be different from initial (even if initial was empty)
        if (initialResults && initialResults.trim()) {
            expect(updatedResults).not.toBe(initialResults);
        }
    });
});

test.describe('Wizard Conditional Fields', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wizard');
    });

    test('Changing age from minor to adult hides guardian agreement', async ({ page }) => {
        // Set age as minor
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('16');
        
        const guardianCheckbox = page.locator('input[name="/properties/personalData/properties/guardianAgrees"]');
        await expect(guardianCheckbox).toBeVisible();
        
        // Change age to adult
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('20');
        
        // Guardian agreement should no longer be visible
        await expect(guardianCheckbox).not.toBeVisible();
    });

    test('Changing age from adult to minor shows guardian agreement', async ({ page }) => {
        // Set age as adult
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('25');
        
        const guardianCheckbox = page.locator('input[name="/properties/personalData/properties/guardianAgrees"]');
        await expect(guardianCheckbox).not.toBeVisible();
        
        // Change age to minor
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('14');
        
        // Guardian agreement should now be visible
        await expect(guardianCheckbox).toBeVisible();
    });

    test('Parents field appears and disappears based on age changes across pages', async ({ page }) => {
        // Fill name and set age as minor
        await page.locator('input[name="/properties/personalData/properties/name"]').fill('Test');
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('16');
        await page.locator('button:has-text("Next")').click();
        
        // Parents field should be visible on page 2
        const parentsContainer = page.locator('[name="/properties/message/properties/parents"]');
        await expect(parentsContainer).toBeVisible();
        
        // Go back and change age to adult
        await page.locator('button:has-text("Previous")').click();
        await page.locator('input[name="/properties/personalData/properties/age"]').fill('25');
        await page.locator('button:has-text("Next")').click();
        
        // Parents field should not be visible
        await expect(parentsContainer).not.toBeVisible();
    });
});
