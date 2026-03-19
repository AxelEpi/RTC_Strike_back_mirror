const host = 'http://localhost:3000';
const apiHost = 'http://localhost:4000';
const username = `lucX`;
const email = `lucX@test.com`;
const password = 'Passw0rd!123';

describe('AUTH signup', () => {
  before(() => {
    // Create user once for duplicate tests
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
  });

  beforeEach(() => {
    //open the signup page before each test
    cy.visit(`${host}/auth/signup`);
  });

  it('should successfully register a new user', () => {
    // Intercept the signup API call
    cy.intercept('POST', '**/auth/signup').as('signupRequest');

    // Use unique credentials for this test (max 20 chars for username)
    const randomId = Math.random().toString(36).substring(2, 8); // 6 chars
    const newUsername = `user_${randomId}`; // user_ (5) + 6 = 11 chars (< 20)
    const newEmail = `test_${randomId}@example.com`;

    //complete the form
    cy.get('input[name="username"]').type(newUsername);
    cy.get('input[name="email"]').type(newEmail);
    cy.get('input[name="password"]').type(password);

    //Click the submit button
    cy.get('button[type="submit"]').click();

    //Wait for the API call to complete successfully
    cy.wait('@signupRequest').then((interception) => {
      // Log response for debugging
      if (interception.response.statusCode !== 200 && interception.response.statusCode !== 201) {
        cy.log('Response:', JSON.stringify(interception.response.body));
      }
      // Accept both 200 and 201 as success codes
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });

    //Wait for redirect to login page
    cy.url({ timeout: 5000 }).should('include', '/auth/login');
  });

  it('should show error for empty username', () => {
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Passw0rd!123');
    cy.get('button[type="submit"]').click();

    //Form validation should prevent submission
    cy.url().should('include', '/auth/signup');
  });

  it('should show error for empty email', () => {
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('Passw0rd!123');
    cy.get('button[type="submit"]').click();

    //Form validation should prevent submission
    cy.url().should('include', '/auth/signup');
  });

  it('should show error for empty password', () => {
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();

    //Form validation should prevent submission
    cy.url().should('include', '/auth/signup');
  });

  it('should show error for weak password', () => {
    cy.intercept('POST', '**/auth/signup').as('signupRequest');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('123');
    cy.get('button[type="submit"]').click();

    //Check for error alert
    cy.get('#alert', { timeout: 5000 }).should('be.visible');
  });

  it('should show error for duplicate username', () => {
    cy.intercept('POST', '**/auth/signup').as('signupRequest');

    //Use the same username that was created in the first test
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="email"]').type(`new${email}`);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.wait('@signupRequest');

    //Check for error alert about duplicate
    cy.get('#alert', { timeout: 5000 }).should('be.visible');
  });

  it('should show error for duplicate email', () => {
    cy.intercept('POST', '**/auth/signup').as('signupRequest');

    //Use the same email that was created in the first test
    cy.get('input[name="username"]').type(`new${username}`);
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.wait('@signupRequest');

    //Check for error alert about duplicate
    cy.get('#alert', { timeout: 5000 }).should('be.visible');
  });
});
