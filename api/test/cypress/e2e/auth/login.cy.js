const host = 'http://localhost:3000';
const apiHost = 'http://localhost:4000';
const username = `lucX`;
const email = `lucX@test.com`;
const password = 'Passw0rd!123';

describe('AUTH login', () => {
  beforeEach(() => {
    //open the login page before each test
    cy.request({
      method: 'DELETE',
      url: `${apiHost}/auth/delete`,  
      body: {
        username: username,
        email: email
      },
      failOnStatusCode: false, // Don't fail if user already exists
    });
    
     cy.request({
      method: 'POST',
      url: `${apiHost}/auth/signup`,
      body: {
        username: username,
        email: email,
        password: password,
      },
      failOnStatusCode: false, // Don't fail if user already exists
    });

    cy.visit(`${host}/auth/login`);
  });

  it('should successfully log in a user', () => {
    // Intercept the login API call
    cy.intercept('POST', '**/auth/login').as('loginRequest');

    //complete the form
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);

    //Click the submit button
    cy.get('button[type="submit"]').click();

     cy.url().should("include", "/servers")

  });

  it('should show error for empty email', () => {
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    //Form validation should prevent submission
    cy.url().should('include', '/auth/login');
  });

  it('should show error for empty password', () => {
    cy.get('input[name="email"]').type(email);
    cy.get('button[type="submit"]').click();

    //Form validation should prevent submission
    cy.url().should('include', '/auth/login');
  });

 
  it('should show error for non-existent user', () => {
    cy.intercept('POST', '**/auth/login').as('loginRequest');

    cy.get('input[name="email"]').type('nonexistent@test.com');
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');

    //Check for error alert
    cy.get('#alert', { timeout: 5000 }).should('be.visible');
  });
});
