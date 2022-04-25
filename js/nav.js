"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories() {
  console.debug("navAllStories");
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick");
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserLinks.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

$navSubmit.on("click", function () {
  console.debug("navSubmit");
  hidePageComponents();
  $submitForm.show();
  putStoriesOnPage();
});

$navFavorites.on("click", function () {
  console.debug("navFavorites");
  hidePageComponents();
  putFavoritesOnPage();
});

$navMyStories.on("click", function () {
  console.debug("navMyStories");
  hidePageComponents();
  putOwnStoriesOnPage();
});

$navUserProfile.on("click", function () {
  console.debug("navUserProfile");
  hidePageComponents();
  $accountInfoContainer.show();
});
