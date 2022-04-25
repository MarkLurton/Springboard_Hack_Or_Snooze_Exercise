"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName(url) {
    return url.split("/")[2];
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map((story) => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    console.debug("addStory");
    const addStoryBody = {
      token: user.loginToken,
      story: newStory,
    };
    try {
      const res = await axios.post(`${BASE_URL}/stories`, addStoryBody);
      const story = new Story(res.data.story);

      this.stories.unshift(story);
      StoryList.getStories();
      return story;
    } catch (error) {
      let message = "";
      if (error.response.status === 400) {
        message =
          "Check your inputs. Be sure to include http:// or https:// on url.";
      }
      alert(
        `Error: ${error.response.status} ${error.response.statusText}. ${message}`
      );
      return null;
    }
  }

  async editStory(user, editStory) {
    console.debug("editStory");
    try {
      const editStoryBodyT = {
        token: user.loginToken,
        story: {
          title: editStory.title,
        },
      };

      const editStoryBodyA = {
        token: user.loginToken,
        story: {
          author: editStory.author,
        },
      };

      const editStoryBodyU = {
        token: user.loginToken,
        story: {
          url: editStory.url,
        },
      };

      await axios.patch(
        `${BASE_URL}/stories/${editStory.storyId}`,
        editStoryBodyA
      );
      await axios.patch(
        `${BASE_URL}/stories/${editStory.storyId}`,
        editStoryBodyU
      );
      const res = await axios.patch(
        `${BASE_URL}/stories/${editStory.storyId}`,
        editStoryBodyT
      );

      const story = new Story(res.data.story);

      this.stories = this.stories.filter(
        (str) => str.storyId !== editStory.storyId
      );
      this.stories.unshift(story);
      StoryList.getStories();
      return story;
    } catch (error) {
      let message = "";
      if (error.response.status === 400) {
        message =
          "Check your inputs. Be sure to include http:// or https:// on url.";
      }
      alert(
        `Error: ${error.response.status} ${error.response.statusText}. ${message}`
      );
      return null;
    }
  }
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor(
    { username, name, createdAt, favorites = [], ownStories = [] },
    token
  ) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    try {
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        response.data.token
      );
    } catch (error) {
      let message = "";
      if (error.response.status === 409) {
        message = "Username already taken. Please select another.";
      }
      alert(
        `Error: ${error.response.status} ${error.response.statusText}. ${message}`
      );
      return null;
    }
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  async deleteStory(event) {
    console.debug("deleteStory");
    let $target = $(event.target);
    const $closestLi = $target.closest("li");
    const storyId = $closestLi.attr("id");

    if ($target.hasClass("trash-can")) {
      $target = $target.children();
    }

    await axios.delete(
      `https://hack-or-snooze-v3.herokuapp.com/stories/${storyId}`,
      {
        data: {
          token: this.loginToken,
        },
      }
    );

    this.favorites = this.favorites.filter(
      (favStory) => favStory.storyId !== storyId
    );

    this.ownStories = this.ownStories.filter(
      (story) => story.storyId !== storyId
    );
    storyList.stories = storyList.stories.filter(
      (str) => str.storyId !== storyId
    );
    putOwnStoriesOnPage();
  }

  addStoryToFavorites(story) {
    this.favorites.push(story);
    axios.post(
      `https://hack-or-snooze-v3.herokuapp.com/users/${this.username}/favorites/${story.storyId}`,
      { token: this.loginToken }
    );
  }

  removeStoryFromFavorites(story) {
    this.favorites = this.favorites.filter(
      (favStory) => favStory.storyId !== story.storyId
    );
    axios.delete(
      `https://hack-or-snooze-v3.herokuapp.com/users/${this.username}/favorites/${story.storyId}`,
      { data: { token: this.loginToken } }
    );
  }

  favoriteCheck(story) {
    return this.favorites.some(
      (favStory) => favStory.storyId === story.storyId
    );
  }
}
