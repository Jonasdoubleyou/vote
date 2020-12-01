_Warning: This application has no authorization at all, that is anybody can create votings (there is a rate limit thought to prevent Denial of Service). You might want to only run it in trusted environments._

# About

This application aims to provide a simple to use voting tool to be embedded into other tools. It is powered by a small NodeJS server keeping polls in memory (no database or persistency layer required). All the voting pages can either be used standalone (visit https://[domain]:2000/) or embedded into another website by embedding scripts and styles as shown below. It is meant for quick polls. 

Here is how the embedded version looks like:

![Screenshot of Vote](/doc/screenshot.png)

# Installation

Run `npm ci`, then `npm start` to start the voting server. Embed the following into your page (a video chat or anything you can imagine):

```HTML
<script>
    // Optional: Automatically join users into certain groups
    // If someone creates a poll, all users in the group will automatically participate
    function getGroupname() {
        return "test"; 
    }
</script>
<link rel="stylesheet" href="[domain]:2000/main.css" />
<script async src="[domain]:2000/main.js"></script></script>
```
