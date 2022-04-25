"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showTrashCan = false, showPencil = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName(story.url);
  const showFav = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showTrashCan ? getTrashCan() : ""}
        ${showPencil ? getPencil() : ""}
        ${showFav ? getStarIcon(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function getStarIcon(story, user) {
  const favorite = user.favoriteCheck(story);
  const favStatus = favorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${favStatus} fa-star"></i>
      </span>`;
}

function getTrashCan() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

function getPencil() {
  return `
      <span class="pencil">
        <i class="fas fa-pencil-alt"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

$submitForm.on("click", async function (event) {
  event.preventDefault();

  if (event.target.className === "cancel") {
    $submitForm.hide();
    return;
  } else if (event.target.className === "submit") {
    let newStory = {
      title: $("#submit-title").val(),
      author: $("#submit-author").val(),
      url: $("#submit-url").val(),
    };

    newStory = new Story(await storyList.addStory(currentUser, newStory));
    currentUser.ownStories.push(newStory);

    $(".submit-inputs").val("");
    hidePageComponents();

    putStoriesOnPage();
  }
});

$;

function putOwnStoriesOnPage() {
  console.debug("putOwnStoriesOnPage");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h4>No stories posted yet!</h4>");
  } else {
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(story, true, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

$ownStories.on("click", ".trash-can", function (event) {
  currentUser.deleteStory(event);
});

$ownStories.on("click", ".pencil", function (event) {
  let $target = $(event.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");
  let story = storyList.stories.find((str) => str.storyId === storyId);

  $("#edit-title").val(`${story.title}`);
  $("#edit-author").val(`${story.author}`);
  $("#edit-url").val(`${story.url}`);
  $editForm.show();
  storyList.editStoryId = storyId;
});

$editForm.on("submit", async function (event) {
  event.preventDefault();
  if (event.target.className === "cancel") {
    $editForm.hide();
    return;
  }
  let editStory = {
    title: $("#edit-title").val(),
    author: $("#edit-author").val(),
    url: $("#edit-url").val(),
    storyId: storyList.editStoryId,
  };
  currentUser.ownStories = currentUser.ownStories.filter(
    (str) => str.storyId !== editStory.storyId
  );
  editStory = new Story(await storyList.editStory(currentUser, editStory));
  currentUser.ownStories.push(editStory);

  const currFavLength = currentUser.favorites.length;
  currentUser.favorites = currentUser.favorites.filter(
    (str) => str.storyId !== editStory.storyId
  );
  if (currentUser.favorites.length !== currFavLength) {
    currentUser.favorites.unshift(editStory);
  }
  $(".edit-inputs").val("");
  hidePageComponents();

  putOwnStoriesOnPage();
});

function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $favorites.empty();

  if (currentUser.favorites.length === 0) {
    $favorites.append("<h4>No favories yet!</h4>");
  } else {
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favorites.append($story);
    }
  }

  $favorites.show();
}

async function toggleFavorite(event) {
  console.debug("toggleFavorite");
  let $target = $(event.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find((str) => str.storyId === storyId);

  if ($target.hasClass("star")) {
    $target = $target.children();
  }

  if ($target.hasClass("fas")) {
    await currentUser.removeStoryFromFavorites(story);
    $target.closest("i").toggleClass("fas far");
  } else {
    await currentUser.addStoryToFavorites(story);
    $target.closest("i").toggleClass("fas far");
  }
}

$storyLists.on("click", ".star", toggleFavorite);
