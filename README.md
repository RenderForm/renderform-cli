## Usage

![How to render image](/readme/rendering.gif)

Create a JSON file in `my-directory` folder and name it `sample.json`.

```json
{
  "renderform": true,
  "data": [
    {
      "my_title.text": "My title", // 'my_title.text' is a template property from Form Editor (Preview popup)
      "my_image.src": "https://example.com/image.png"
    }
  ]
}
```

Then run the command:

```bash
npx @renderform/cli@1.1.1 --template <YOUR_TEMPLATE> --apiKey <YOUR_API_KEY> ./my-directory
```

The CLI will look for all JSON files in the directory and will create a new image or PDF file for each JSON file with the same name but with the corresponding extension.

![Sample output](/readme/my-blog-post.jpg)

## Options

### `--template`

The template ID to use. You can find the template ID in the URL of the template page.

### `--apiKey`

Your API key. You can find it in your RenderForm account.

### `--overwrite`

Overwrite existing files. By default, the CLI skips rendering for already rendered files. Use this option to force the CLI to request the
render and overwrite the existing file.

### `--debug`

Enable debug mode. It will print the API response in the console.

### `--no-cache`

Disable cache. It will force the CLI to re-render image from the API.

