# Dublin Shelf Finder

The Dublin Shelf Finder is a tool that helps students find books on the library shelves.

It has two parts:
- The [extension](https://github.com/deryilz/shelf-finder-extension), which adds "find shelf" buttons to Destiny Discover. When clicked, these put an `<iframe>` on the page containing the map.
- The map (/public/map), which takes the info from the Destiny page, gets the shelf map for the current school, and highlights the correct shelf based off the call number (and sublocation) of the book.
- The admin dashboard (/public/admin), which allows librarians to log in and securely edit the shelf map for their schools.

More info can be found on the [website](https://shelf-finder.com).
