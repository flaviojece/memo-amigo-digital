import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('deve exibir formulário de login', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('deve mostrar erro ao enviar credenciais vazias', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Deve mostrar mensagens de validação
    await expect(page.getByText(/email inválido/i)).toBeVisible();
  });
});
