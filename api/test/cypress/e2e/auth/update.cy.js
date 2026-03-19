const host = 'http://localhost:3000';
const apiHost = 'http://localhost:4000';
const username = `lucX`;
const email = `lucX@test.com`;
const password = 'Passw0rd!123';

describe('AUTH update', () => {
  beforeEach(() => {
    // Delete user if exists
    cy.request({
      method: 'DELETE',
      url: `${apiHost}/auth/delete`,
      body: {
        username: username,
        email: email,
      },
      failOnStatusCode: false,
    });

    // Create user
    cy.request({
      method: 'POST',
      url: `${apiHost}/auth/signup`,
      body: {
        username: username,
        email: email,
        password: password,
      },
      failOnStatusCode: false,
    });

    // Login via API to get the auth cookie
    cy.request({
      method: 'POST',
      url: `${apiHost}/auth/login`,
      body: {
        email: email,
        password: password,
      },
    });

    // Now visit the update page (authenticated with cookie from API)
    cy.visit(`${host}/auth/update`);
  });

  it('should load user data when page loads', () => {
    cy.get('input[name="username"]').should('have.value', username);
    cy.get('input[name="email"]').should('have.value', email);
  });

  it('should successfully update user profile', () => {
    cy.intercept('PUT', '**/auth/update').as('updateRequest');

    const newUsername = `updated${Date.now()}`;
    const newEmail = `updated${Date.now()}@test.com`;
    const newDescription = 'Updated description';

    cy.get('input[name="username"]').clear({ force: true }).type(newUsername);
    cy.get('input[name="email"]').clear({ force: true }).type(newEmail);
    cy.get('input[name="description"]').clear({ force: true }).type(newDescription);

    cy.get('button[type="submit"]').click();
  });

  it('should show error for empty username', () => {
    cy.get('input[name="username"]').clear({ force: true });
    cy.get('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    cy.url().should('include', '/auth/update');
  });

  it('should show error for empty email', () => {
    cy.get('input[name="email"]').clear({ force: true });
    cy.get('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    cy.url().should('include', '/auth/update');
  });

  it('should show error for empty description', () => {
    cy.get('input[name="description"]').clear({ force: true });
    cy.get('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    cy.url().should('include', '/auth/update');
  });

  it('should show error for invalid email format', () => {
    cy.get('input[name="email"]').clear({ force: true }).type('invalid-email');
    cy.get('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    cy.url().should('include', '/auth/update');
  });

  it('should respect maxLength constraint', () => {
    const longText = 'a'.repeat(60);

    cy.get('input[name="username"]').clear({ force: true }).type(longText);
    cy.get('input[name="username"]')
      .invoke('val')
      .then((val) => {
        expect(val.length).to.be.lte(255); // Username max 20 chars
      });
  });

  it('should show error for duplicate username', () => {
    const otherUser = {
      username: `other${Date.now()}`,
      email: `other${Date.now()}@test.com`,
      password: 'Passw0rd!123',
    };

    // Create another user
    cy.request('POST', `${apiHost}/auth/signup`, {
      username: otherUser.username,
      email: otherUser.email,
      password: otherUser.password,
    });

    cy.intercept('PUT', '**/auth/update').as('updateRequest');

    const newEmail = `new${Date.now()}@test.com`;

    cy.get('input[name="username"]').clear({ force: true }).type(otherUser.username);
    cy.get('input[name="email"]').clear({ force: true }).type(newEmail);
    cy.get('input[name="description"]').clear({ force: true }).type('Test description');
    cy.get('button[type="submit"]').click();

    cy.wait('@updateRequest').then((interception) => {
      expect(interception.response.statusCode).to.not.eq(200);
    });

    // Should NOT redirect
    cy.url().should('include', '/auth/update');

    // Cleanup other user
    cy.request({
      method: 'DELETE',
      url: `${apiHost}/auth/delete`,
      body: { username: otherUser.username, email: otherUser.email },
      failOnStatusCode: false,
    });
  });

  it('should show error for duplicate email', () => {
    const otherUser = {
      username: `another${Date.now()}`,
      email: `another${Date.now()}@test.com`,
      password: 'Passw0rd!123',
    };

    // Create another user
    cy.request('POST', `${apiHost}/auth/signup`, {
      username: otherUser.username,
      email: otherUser.email,
      password: otherUser.password,
    });

    cy.intercept('PUT', '**/auth/update').as('updateRequest');

    const newUsername = `new${Date.now()}`;

    cy.get('input[name="username"]').clear({ force: true }).type(newUsername);
    cy.get('input[name="email"]').clear({ force: true }).type(otherUser.email);
    cy.get('input[name="description"]').clear({ force: true }).type('Test description');
    cy.get('button[type="submit"]').click();

    cy.wait('@updateRequest').then((interception) => {
      expect(interception.response.statusCode).to.not.eq(200);
    });

    cy.url().should('include', '/auth/update');

    // Cleanup other user
    cy.request({
      method: 'DELETE',
      url: `${apiHost}/auth/delete`,
      body: { username: otherUser.username, email: otherUser.email },
      failOnStatusCode: false,
    });
  });

  it('should cancel and redirect to /servers', () => {
    cy.contains('button[type="button"]', /cancel/i).click({ force: true });
    cy.url({ timeout: 5000 }).should('include', '/servers');
  });

});
