document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const createPostForm = document.getElementById("createPostForm");
    const postsContainer = document.getElementById("postsContainer");
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const userId = localStorage.getItem("userId");

    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userName: username, password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.accessToken) {
                    const actualToken = data.accessToken.split(' ')[1];
                    localStorage.setItem("token", actualToken);
                    localStorage.setItem("username", username);
                    localStorage.setItem("userId", data.userId);
                    alert("Login successful!");
                    window.location.href = "index.html";
                } else {
                    alert("Login failed: " + data.message);
                }
            })
            .catch(error => console.error("Error:", error));
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            fetch("http://localhost:8080/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userName: username, password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.accessToken) {
                    const actualToken = data.accessToken.split(' ')[1];
                    localStorage.setItem("token", actualToken);
                    localStorage.setItem("username", username);
                    localStorage.setItem("userId", data.userId);
                    alert("Registration successful!");
                    window.location.href = "index.html";
                } else {
                    alert("Registration failed: " + data.message);
                }
            })
            .catch(error => console.error("Error:", error));
        });
    }

    if (token && username) {
        document.getElementById("loginLink").style.display = "none";
        document.getElementById("registerLink").style.display = "none";
        document.getElementById("userMenu").style.display = "block";
        document.getElementById("username").textContent = username;
        document.getElementById("createPostContainer").style.display = "block";

        document.getElementById("logout").addEventListener("click", function() {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("userId");
            window.location.href = "index.html";
        });
    }

    if (createPostForm) {
        createPostForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const postTitle = document.getElementById("postTitle").value;
            const postText = document.getElementById("postText").value;

            fetch("http://localhost:8080/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title: postTitle, text: postText, userId: userId })
            })
            .then(response => {
                console.log('Response status:', response.status);
                if (response.ok) {
                    return response.json();
                }
                return response.text().then(text => { throw new Error(text || response.statusText); });
            })
            .then(data => {
                alert("Post created!");
                window.location.reload();
            })
            .catch(error => {
                alert("Error: " + error.message);
                console.error("Error:", error);
            });
        });
    }

    if (postsContainer) {
        fetch("http://localhost:8080/posts", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : ""
            }
        })
        .then(response => response.json())
        .then(posts => {
            postsContainer.innerHTML = "";
            posts.forEach(post => {
                const postDiv = document.createElement("div");
                postDiv.classList.add("post");
                postDiv.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.text}</p>
                    <p>Posted by: ${post.userName || "Unknown"}</p>
                    <p>Likes: ${post.postLikes.length}</p>
                    <div class="comments" id="comments-${post.id}"></div>
                `;
                if (token) {
                    const likeButton = document.createElement("button");
                    likeButton.textContent = "Like";
                    likeButton.addEventListener("click", function() {
                        fetch(`http://localhost:8080/likes`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({ userId: userId, postId: post.id })
                        })
                        .then(response => {
                            console.log('Response status:', response.status);
                            if (response.ok) {
                                return response.json();
                            }
                            return response.text().then(text => { throw new Error(text || response.statusText); });
                        })
                        .then(data => {
                            alert("Post liked!");
                            window.location.reload();
                        })
                        .catch(error => {
                            alert("Error: " + error.message);
                            console.error("Error:", error);
                        });
                    });
                    postDiv.appendChild(likeButton);

                    const commentForm = document.createElement("form");
                    commentForm.innerHTML = `
                        <input type="text" name="comment" placeholder="Write a comment" required>
                        <button type="submit">Comment</button>
                    `;
                    commentForm.addEventListener("submit", function(event) {
                        event.preventDefault();
                        const commentText = commentForm.querySelector('input[name="comment"]').value;

                        fetch(`http://localhost:8080/comments`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({ userId: userId, postId: post.id, text: commentText })
                        })
                        .then(response => {
                            console.log('Response status:', response.status);
                            if (response.ok) {
                                return response.json();
                            }
                            return response.text().then(text => { throw new Error(text || response.statusText); });
                        })
                        .then(data => {
                            alert("Comment added!");
                            window.location.reload();
                        })
                        .catch(error => {
                            alert("Error: " + error.message);
                            console.error("Error:", error);
                        });
                    });
                    postDiv.appendChild(commentForm);
                }
                postsContainer.appendChild(postDiv);

                fetch(`http://localhost:8080/comments?postId=${post.id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token ? `Bearer ${token}` : ""
                    }
                })
                .then(response => response.json())
                .then(comments => {
                    const commentsDiv = document.getElementById(`comments-${post.id}`);
                    comments.forEach(comment => {
                        const commentDiv = document.createElement("div");
                        commentDiv.classList.add("comment");
                        commentDiv.innerHTML = `
                            <p>${comment.text} - <strong>${comment.userName || "Unknown"}</strong></p>
                        `;
                        commentsDiv.appendChild(commentDiv);
                    });
                })
                .catch(error => console.error("Error:", error));
            });
        })
        .catch(error => console.error("Error:", error));
    }
});
