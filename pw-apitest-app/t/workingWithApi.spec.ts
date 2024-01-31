import { test, expect } from '@playwright/test';
import tags from '../test-data/tags.json'
import { request } from 'http';

test.beforeEach(async ({ page }) => {
  await page.route('*/**/api/tags', async route => {
    await route.fulfill({
      body: JSON.stringify(tags)
    })
  })

  await page.goto('https://angular.realworld.how');
  await page.getByText('Sign in').click()
  await page.getByRole('textbox', {name: "Email"}).fill('pwtest99@test.com')
  await page.getByRole('textbox', {name: 'Password'}).fill('welcome1')
  await page.getByRole('button').click()
})



test('has title', async ({ page }) => {
  await page.route('*/**/api/articles*', async route => {
    const response = await route.fetch()
    const responseBody = await response.json()

    responseBody.articles[0].title = 'This is a test title'
    responseBody.articles[0].description = 'About a test'

    await route.fulfill({
      body: JSON.stringify(responseBody)
    })
  })

  await page.getByText('Global Feed').click()
  await expect(page.locator('.navbar-brand')).toHaveText('conduit')
  await expect(page.locator('app-article-list h1').first()).toContainText('This is a test title')
  await expect(page.locator('app-article-list p').first()).toContainText('About a test')
})

test('Delete article', async ({ page, request }) => {
  const response = await request.post('https://api.realworld.io/api/users/login', {
    data: {
      "user": { "email": "pwtest99@test.com", "password": "welcome1" }
    }
  });
  const responseBody = await response.json()
  const accessToken = responseBody.user.token

  const articleResponse = await request.post('https://api.realworld.io/api/articles/', {
    data: {
      "article": { "title": "This is a test title", "description": "test article ", "body": "test artivle", "tagList": [] }
    },
    headers: {
      Authorization: `Token ${accessToken}`
    }
  })

  expect(articleResponse.status()).toEqual(201)
  await page.getByText('Global Feed').click()
  await page.getByText('test article').click()
  await page.getByRole('button', {name: 'Delete Article'}).first().click()
  await page.getByText('Global Feed').click()
})

test('create article', async({page}) => {
  await page.getByText('New Article').click()
  await page.getByRole('textbox', {name: 'Article Title'}).fill('Playwright is awesome')
  await page.getByRole('textbox', {name: "What's this article about?"}).fill('About the Playwright')
  await page.getByRole('textbox', {name: 'Write your article (in markdown)'}).fill('We like to use Playwright for automation')
  await page.getByRole('button', {name: 'Publish Article'}).click()
  await expect(page.locator('.article-page h1')).toContainText('Playwright is awesome')
  await page.getByText('Home').click()
  await page.getByText('Global Feed').click()
  await expect(page.locator('app-article-list h1').first()).toContainText('Playwright is awesome')

})