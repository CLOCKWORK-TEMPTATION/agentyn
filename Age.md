# Workflow Agents

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python</span><span class="lst-typescript">TypeScript</span><span class="lst-go">Go</span><span class="lst-java">Java</span>
</div>

This section introduces "*workflow agents*" - **specialized agents that control the execution flow of its sub-agents**.

Workflow agents are specialized components in ADK designed purely for **orchestrating the execution flow of sub-agents**. Their primary role is to manage *how* and *when* other agents run, defining the control flow of a process.

Unlike [LLM Agents](../llm-agents.md), which use Large Language Models for dynamic reasoning and decision-making, Workflow Agents operate based on **predefined logic**. They determine the execution sequence according to their type (e.g., sequential, parallel, loop) without consulting an LLM for the orchestration itself. This results in **deterministic and predictable execution patterns**.

ADK provides three core workflow agent types, each implementing a distinct execution pattern:

<div class="grid cards" markdown>

- :material-console-line: **Sequential Agents**

    ---

    Executes sub-agents one after another, in **sequence**.

    [:octicons-arrow-right-24: Learn more](sequential-agents.md)

- :material-console-line: **Loop Agents**

    ---

    **Repeatedly** executes its sub-agents until a specific termination condition is met.

    [:octicons-arrow-right-24: Learn more](loop-agents.md)

- :material-console-line: **Parallel Agents**

    ---

    Executes multiple sub-agents in **parallel**.

    [:octicons-arrow-right-24: Learn more](parallel-agents.md)

</div>

## Why Use Workflow Agents?

Workflow agents are essential when you need explicit control over how a series of tasks or agents are executed. They provide:

* **Predictability:** The flow of execution is guaranteed based on the agent type and configuration.
* **Reliability:** Ensures tasks run in the required order or pattern consistently.
* **Structure:** Allows you to build complex processes by composing agents within clear control structures.

While the workflow agent manages the control flow deterministically, the sub-agents it orchestrates can themselves be any type of agent, including intelligent LLM Agent instances. This allows you to combine structured process control with flexible, LLM-powered task execution.
# Artifacts

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.1.0</span><span class="lst-typescript">TypeScript v0.2.0</span><span class="lst-go">Go v0.1.0</span><span class="lst-java">Java v0.1.0</span>
</div>

In ADK, **Artifacts** represent a crucial mechanism for managing named, versioned binary data associated either with a specific user interaction session or persistently with a user across multiple sessions. They allow your agents and tools to handle data beyond simple text strings, enabling richer interactions involving files, images, audio, and other binary formats.

!!! Note
    The specific parameters or method names for the primitives may vary slightly by SDK language (e.g., `save_artifact` in Python, `saveArtifact` in Java). Refer to the language-specific API documentation for details.

## What are Artifacts?

*   **Definition:** An Artifact is essentially a piece of binary data (like the content of a file) identified by a unique `filename` string within a specific scope (session or user). Each time you save an artifact with the same filename, a new version is created.

*   **Representation:** Artifacts are consistently represented using the standard `google.genai.types.Part` object. The core data is typically stored within an inline data structure of the `Part` (accessed via `inline_data`), which itself contains:
    *   `data`: The raw binary content as bytes.
    *   `mime_type`: A string indicating the type of the data (e.g., `"image/png"`, `"application/pdf"`). This is essential for correctly interpreting the data later.


=== "Python"

    ```py
    # Example of how an artifact might be represented as a types.Part
    import google.genai.types as types

    # Assume 'image_bytes' contains the binary data of a PNG image
    image_bytes = b'\x89PNG\r\n\x1a\n...' # Placeholder for actual image bytes

    image_artifact = types.Part(
        inline_data=types.Blob(
            mime_type="image/png",
            data=image_bytes
        )
    )

    # You can also use the convenience constructor:
    # image_artifact_alt = types.Part.from_bytes(data=image_bytes, mime_type="image/png")

    print(f"Artifact MIME Type: {image_artifact.inline_data.mime_type}")
    print(f"Artifact Data (first 10 bytes): {image_artifact.inline_data.data[:10]}...")
    ```

=== "Typescript"

    ```typescript
    import type { Part } from '@google/genai';
    import { createPartFromBase64 } from '@google/genai';

    // Assume 'imageBytes' contains the binary data of a PNG image
    const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // Placeholder

    const imageArtifact: Part = createPartFromBase64(imageBytes.toString('base64'), "image/png");

    console.log(`Artifact MIME Type: ${imageArtifact.inlineData?.mimeType}`);
    // Note: Accessing raw bytes would require decoding from base64.
    ```

=== "Go"

    ```go
    import (
      "log"

      "google.golang.org/genai"
    )

    --8<-- "examples/go/snippets/artifacts/main.go:representation"
    ```

=== "Java"

    ```java
    import com.google.genai.types.Part;
    import java.nio.charset.StandardCharsets;

    public class ArtifactExample {
        public static void main(String[] args) {
            // Assume 'imageBytes' contains the binary data of a PNG image
            byte[] imageBytes = {(byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47, (byte) 0x0D, (byte) 0x0A, (byte) 0x1A, (byte) 0x0A, (byte) 0x01, (byte) 0x02}; // Placeholder for actual image bytes

            // Create an image artifact using Part.fromBytes
            Part imageArtifact = Part.fromBytes(imageBytes, "image/png");

            System.out.println("Artifact MIME Type: " + imageArtifact.inlineData().get().mimeType().get());
            System.out.println(
                "Artifact Data (first 10 bytes): "
                    + new String(imageArtifact.inlineData().get().data().get(), 0, 10, StandardCharsets.UTF_8)
                    + "...");
        }
    }
    ```

*   **Persistence & Management:** Artifacts are not stored directly within the agent or session state. Their storage and retrieval are managed by a dedicated **Artifact Service** (an implementation of `BaseArtifactService`, defined in `google.adk.artifacts`. ADK provides various implementations, such as:
    *   An in-memory service for testing or temporary storage (e.g., `InMemoryArtifactService` in Python, defined in `google.adk.artifacts.in_memory_artifact_service.py`).
    *   A service for persistent storage using Google Cloud Storage (GCS) (e.g., `GcsArtifactService` in Python, defined in `google.adk.artifacts.gcs_artifact_service.py`).
    The chosen service implementation handles versioning automatically when you save data.

## Why Use Artifacts?

While session `state` is suitable for storing small pieces of configuration or conversational context (like strings, numbers, booleans, or small dictionaries/lists), Artifacts are designed for scenarios involving binary or large data:

1. **Handling Non-Textual Data:** Easily store and retrieve images, audio clips, video snippets, PDFs, spreadsheets, or any other file format relevant to your agent's function.
2. **Persisting Large Data:** Session state is generally not optimized for storing large amounts of data. Artifacts provide a dedicated mechanism for persisting larger blobs without cluttering the session state.
3. **User File Management:** Provide capabilities for users to upload files (which can be saved as artifacts) and retrieve or download files generated by the agent (loaded from artifacts).
4. **Sharing Outputs:** Enable tools or agents to generate binary outputs (like a PDF report or a generated image) that can be saved via `save_artifact` and later accessed by other parts of the application or even in subsequent sessions (if using user namespacing).
5. **Caching Binary Data:** Store the results of computationally expensive operations that produce binary data (e.g., rendering a complex chart image) as artifacts to avoid regenerating them on subsequent requests.

In essence, whenever your agent needs to work with file-like binary data that needs to be persisted, versioned, or shared, Artifacts managed by an `ArtifactService` are the appropriate mechanism within ADK.


## Common Use Cases

Artifacts provide a flexible way to handle binary data within your ADK applications.

Here are some typical scenarios where they prove valuable:

* **Generated Reports/Files:**
    * A tool or agent generates a report (e.g., a PDF analysis, a CSV data export, an image chart).

* **Handling User Uploads:**

    * A user uploads a file (e.g., an image for analysis, a document for summarization) through a front-end interface.

* **Storing Intermediate Binary Results:**

    * An agent performs a complex multi-step process where one step generates intermediate binary data (e.g., audio synthesis, simulation results).

* **Persistent User Data:**

    * Storing user-specific configuration or data that isn't a simple key-value state.

* **Caching Generated Binary Content:**

    * An agent frequently generates the same binary output based on certain inputs (e.g., a company logo image, a standard audio greeting).



## Core Concepts

Understanding artifacts involves grasping a few key components: the service that manages them, the data structure used to hold them, and how they are identified and versioned.

### Artifact Service (`BaseArtifactService`)

* **Role:** The central component responsible for the actual storage and retrieval logic for artifacts. It defines *how* and *where* artifacts are persisted.

* **Interface:** Defined by the abstract base class `BaseArtifactService`. Any concrete implementation must provide methods for:

    * `Save Artifact`: Stores the artifact data and returns its assigned version number.
    * `Load Artifact`: Retrieves a specific version (or the latest) of an artifact.
    * `List Artifact keys`: Lists the unique filenames of artifacts within a given scope.
    * `Delete Artifact`: Removes an artifact (and potentially all its versions, depending on implementation).
    * `List versions`: Lists all available version numbers for a specific artifact filename.

* **Configuration:** You provide an instance of an artifact service (e.g., `InMemoryArtifactService`, `GcsArtifactService`) when initializing the `Runner`. The `Runner` then makes this service available to agents and tools via the `InvocationContext`.

=== "Python"

    ```py
    from google.adk.runners import Runner
    from google.adk.artifacts import InMemoryArtifactService # Or GcsArtifactService
    from google.adk.agents import LlmAgent # Any agent
    from google.adk.sessions import InMemorySessionService

    # Example: Configuring the Runner with an Artifact Service
    my_agent = LlmAgent(name="artifact_user_agent", model="gemini-2.0-flash")
    artifact_service = InMemoryArtifactService() # Choose an implementation
    session_service = InMemorySessionService()

    runner = Runner(
        agent=my_agent,
        app_name="my_artifact_app",
        session_service=session_service,
        artifact_service=artifact_service # Provide the service instance here
    )
    # Now, contexts within runs managed by this runner can use artifact methods
    ```

=== "Typescript"

    ```typescript
    import { InMemoryRunner } from '@google/adk';
    import { LlmAgent } from '@google/adk';
    import { InMemoryArtifactService } from '@google/adk';

    // Example: Configuring the Runner with an Artifact Service
    const myAgent = new LlmAgent({name: "artifact_user_agent", model: "gemini-2.5-flash"});
    const artifactService = new InMemoryArtifactService(); // Choose an implementation
    const sessionService = new InMemoryArtifactService();

    const runner = new InMemoryRunner({
        agent: myAgent,
        appName: "my_artifact_app",
        sessionService: sessionService,
        artifactService: artifactService, // Provide the service instance here
    });
    // Now, contexts within runs managed by this runner can use artifact methods
    ```

=== "Go"

    ```go
    import (
      "context"
      "log"

      "google.golang.org/adk/agent/llmagent"
      "google.golang.org/adk/artifactservice"
      "google.golang.org/adk/llm/gemini"
      "google.golang.org/adk/runner"
      "google.golang.org/adk/sessionservice"
      "google.golang.org/genai"
	)

	--8<-- "examples/go/snippets/artifacts/main.go:configure-runner"
    ```

=== "Java"

    ```java
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.runner.Runner;
    import com.google.adk.sessions.InMemorySessionService;
    import com.google.adk.artifacts.InMemoryArtifactService;

    // Example: Configuring the Runner with an Artifact Service
    LlmAgent myAgent =  LlmAgent.builder()
      .name("artifact_user_agent")
      .model("gemini-2.0-flash")
      .build();
    InMemoryArtifactService artifactService = new InMemoryArtifactService(); // Choose an implementation
    InMemorySessionService sessionService = new InMemorySessionService();

    Runner runner = new Runner(myAgent, "my_artifact_app", artifactService, sessionService); // Provide the service instance here
    // Now, contexts within runs managed by this runner can use artifact methods
    ```

### Artifact Data

* **Standard Representation:** Artifact content is universally represented using the `google.genai.types.Part` object, the same structure used for parts of LLM messages.

* **Key Attribute (`inline_data`):** For artifacts, the most relevant attribute is `inline_data`, which is a `google.genai.types.Blob` object containing:

    * `data` (`bytes`): The raw binary content of the artifact.
    * `mime_type` (`str`): A standard MIME type string (e.g., `'application/pdf'`, `'image/png'`, `'audio/mpeg'`) describing the nature of the binary data. **This is crucial for correct interpretation when loading the artifact.**

=== "Python"

    ```python
    import google.genai.types as types

    # Example: Creating an artifact Part from raw bytes
    pdf_bytes = b'%PDF-1.4...' # Your raw PDF data
    pdf_mime_type = "application/pdf"

    # Using the constructor
    pdf_artifact_py = types.Part(
        inline_data=types.Blob(data=pdf_bytes, mime_type=pdf_mime_type)
    )

    # Using the convenience class method (equivalent)
    pdf_artifact_alt_py = types.Part.from_bytes(data=pdf_bytes, mime_type=pdf_mime_type)

    print(f"Created Python artifact with MIME type: {pdf_artifact_py.inline_data.mime_type}")
    ```

=== "Typescript"

    ```typescript
    import type { Part } from '@google/genai';
    import { createPartFromBase64 } from '@google/genai';

    // Example: Creating an artifact Part from raw bytes
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // Your raw PDF data
    const pdfMimeType = "application/pdf";

    const pdfArtifact: Part = createPartFromBase64(pdfBytes.toString('base64'), pdfMimeType);
    console.log(`Created TypeScript artifact with MIME Type: ${pdfArtifact.inlineData?.mimeType}`);
    ```

=== "Go"

    ```go
    import (
      "log"
      "os"

      "google.golang.org/genai"
    )

    --8<-- "examples/go/snippets/artifacts/main.go:artifact-data"
    ```

=== "Java"

    ```java
    --8<-- "examples/java/snippets/src/main/java/artifacts/ArtifactDataExample.java:full_code"
    ```

### Filename

* **Identifier:** A simple string used to name and retrieve an artifact within its specific namespace.
* **Uniqueness:** Filenames must be unique within their scope (either the session or the user namespace).
* **Best Practice:** Use descriptive names, potentially including file extensions (e.g., `"monthly_report.pdf"`, `"user_avatar.jpg"`), although the extension itself doesn't dictate behavior – the `mime_type` does.

### Versioning

* **Automatic Versioning:** The artifact service automatically handles versioning. When you call `save_artifact`, the service determines the next available version number (typically starting from 0 and incrementing) for that specific filename and scope.
* **Returned by `save_artifact`:** The `save_artifact` method returns the integer version number that was assigned to the newly saved artifact.
* **Retrieval:**
  * `load_artifact(..., version=None)` (default): Retrieves the *latest* available version of the artifact.
  * `load_artifact(..., version=N)`: Retrieves the specific version `N`.
* **Listing Versions:** The `list_versions` method (on the service, not context) can be used to find all existing version numbers for an artifact.

### Namespacing (Session vs. User)

* **Concept:** Artifacts can be scoped either to a specific session or more broadly to a user across all their sessions within the application. This scoping is determined by the `filename` format and handled internally by the `ArtifactService`.

* **Default (Session Scope):** If you use a plain filename like `"report.pdf"`, the artifact is associated with the specific `app_name`, `user_id`, *and* `session_id`. It's only accessible within that exact session context.


* **User Scope (`"user:"` prefix):** If you prefix the filename with `"user:"`, like `"user:profile.png"`, the artifact is associated only with the `app_name` and `user_id`. It can be accessed or updated from *any* session belonging to that user within the app.


=== "Python"

    ```python
    # Example illustrating namespace difference (conceptual)

    # Session-specific artifact filename
    session_report_filename = "summary.txt"

    # User-specific artifact filename
    user_config_filename = "user:settings.json"

    # When saving 'summary.txt' via context.save_artifact,
    # it's tied to the current app_name, user_id, and session_id.

    # When saving 'user:settings.json' via context.save_artifact,
    # the ArtifactService implementation should recognize the "user:" prefix
    # and scope it to app_name and user_id, making it accessible across sessions for that user.
    ```

=== "Typescript"

    ```typescript
    // Example illustrating namespace difference (conceptual)

    // Session-specific artifact filename
    const sessionReportFilename = "summary.txt";

    // User-specific artifact filename
    const userConfigFilename = "user:settings.json";

    // When saving 'summary.txt' via context.saveArtifact, it's tied to the current appName, userId, and sessionId.
    // When saving 'user:settings.json' via context.saveArtifact, the ArtifactService implementation recognizes the "user:" prefix and scopes it to appName and userId, making it accessible across sessions for that user.
    ```

=== "Go"

    ```go
    import (
      "log"
    )

    --8<-- "examples/go/snippets/artifacts/main.go:namespacing"
    ```

=== "Java"

    ```java
    // Example illustrating namespace difference (conceptual)

    // Session-specific artifact filename
    String sessionReportFilename = "summary.txt";

    // User-specific artifact filename
    String userConfigFilename = "user:settings.json"; // The "user:" prefix is key

    // When saving 'summary.txt' via context.save_artifact,
    // it's tied to the current app_name, user_id, and session_id.
    // artifactService.saveArtifact(appName, userId, sessionId1, sessionReportFilename, someData);

    // When saving 'user:settings.json' via context.save_artifact,
    // the ArtifactService implementation should recognize the "user:" prefix
    // and scope it to app_name and user_id, making it accessible across sessions for that user.
    // artifactService.saveArtifact(appName, userId, sessionId1, userConfigFilename, someData);
    ```

These core concepts work together to provide a flexible system for managing binary data within the ADK framework.

## Interacting with Artifacts (via Context Objects)

The primary way you interact with artifacts within your agent's logic (specifically within callbacks or tools) is through methods provided by the `CallbackContext` and `ToolContext` objects. These methods abstract away the underlying storage details managed by the `ArtifactService`.

### Prerequisite: Configuring the `ArtifactService`

Before you can use any artifact methods via the context objects, you **must** provide an instance of a [`BaseArtifactService` implementation](#available-implementations) (like [`InMemoryArtifactService`](#inmemoryartifactservice) or [`GcsArtifactService`](#gcsartifactservice)) when initializing your `Runner`.

=== "Python"

    In Python, you provide this instance when initializing your `Runner`.

    ```python
    from google.adk.runners import Runner
    from google.adk.artifacts import InMemoryArtifactService # Or GcsArtifactService
    from google.adk.agents import LlmAgent
    from google.adk.sessions import InMemorySessionService

    # Your agent definition
    agent = LlmAgent(name="my_agent", model="gemini-2.0-flash")

    # Instantiate the desired artifact service
    artifact_service = InMemoryArtifactService()

    # Provide it to the Runner
    runner = Runner(
        agent=agent,
        app_name="artifact_app",
        session_service=InMemorySessionService(),
        artifact_service=artifact_service # Service must be provided here
    )
    ```
    If no `artifact_service` is configured in the `InvocationContext` (which happens if it's not passed to the `Runner`), calling `save_artifact`, `load_artifact`, or `list_artifacts` on the context objects will raise a `ValueError`.

=== "Typescript"

    ```typescript
    import { LlmAgent, InMemoryRunner, InMemoryArtifactService } from '@google/adk';

    // Your agent definition
    const agent = new LlmAgent({name: "my_agent", model: "gemini-2.5-flash"});

    // Instantiate the desired artifact service
    const artifactService = new InMemoryArtifactService();

    // Provide it to the Runner
    const runner = new InMemoryRunner({
        agent: agent,
        appName: "artifact_app",
        sessionService: new InMemoryArtifactService(),
        artifactService: artifactService, // Service must be provided here
    });
    // If no artifactService is configured, calling artifact methods on context objects will throw an error.
    ```
    In Java, if an `ArtifactService` instance is not available (e.g., `null`) when artifact operations are attempted, it would typically result in a `NullPointerException` or a custom error, depending on how your application is structured. Robust applications often use dependency injection frameworks to manage service lifecycles and ensure availability.

=== "Go"

    ```go
    import (
      "context"
      "log"

      "google.golang.org/adk/agent/llmagent"
      "google.golang.org/adk/artifactservice"
      "google.golang.org/adk/llm/gemini"
      "google.golang.org/adk/runner"
      "google.golang.org/adk/sessionservice"
      "google.golang.org/genai"
    )

    --8<-- "examples/go/snippets/artifacts/main.go:prerequisite"
    ```

=== "Java"

    In Java, you would instantiate a `BaseArtifactService` implementation and then ensure it's accessible to the parts of your application that manage artifacts. This is often done through dependency injection or by explicitly passing the service instance.

    ```java
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.artifacts.InMemoryArtifactService; // Or GcsArtifactService
    import com.google.adk.runner.Runner;
    import com.google.adk.sessions.InMemorySessionService;

    public class SampleArtifactAgent {

      public static void main(String[] args) {

        // Your agent definition
        LlmAgent agent = LlmAgent.builder()
            .name("my_agent")
            .model("gemini-2.0-flash")
            .build();

        // Instantiate the desired artifact service
        InMemoryArtifactService artifactService = new InMemoryArtifactService();

        // Provide it to the Runner
        Runner runner = new Runner(agent,
            "APP_NAME",
            artifactService, // Service must be provided here
            new InMemorySessionService());

      }
    }
    ```

### Accessing Methods

The artifact interaction methods are available directly on instances of `CallbackContext` (passed to agent and model callbacks) and `ToolContext` (passed to tool callbacks). Remember that `ToolContext` inherits from `CallbackContext`.

#### Saving Artifacts

*   **Code Example:**

    === "Python"

        ```python
        import google.genai.types as types
        from google.adk.agents.callback_context import CallbackContext # Or ToolContext

        async def save_generated_report_py(context: CallbackContext, report_bytes: bytes):
            """Saves generated PDF report bytes as an artifact."""
            report_artifact = types.Part.from_bytes(
                data=report_bytes,
                mime_type="application/pdf"
            )
            filename = "generated_report.pdf"

            try:
                version = await context.save_artifact(filename=filename, artifact=report_artifact)
                print(f"Successfully saved Python artifact '{filename}' as version {version}.")
                # The event generated after this callback will contain:
                # event.actions.artifact_delta == {"generated_report.pdf": version}
            except ValueError as e:
                print(f"Error saving Python artifact: {e}. Is ArtifactService configured in Runner?")
            except Exception as e:
                # Handle potential storage errors (e.g., GCS permissions)
                print(f"An unexpected error occurred during Python artifact save: {e}")

        # --- Example Usage Concept (Python) ---
        # async def main_py():
        #   callback_context: CallbackContext = ... # obtain context
        #   report_data = b'...' # Assume this holds the PDF bytes
        #   await save_generated_report_py(callback_context, report_data)
        ```

    === "Typescript"

        ```typescript
        import type { Part } from '@google/genai';
        import { createPartFromBase64 } from '@google/genai';
        import { CallbackContext } from '@google/adk';

        async function saveGeneratedReport(context: CallbackContext, reportBytes: Uint8Array): Promise<void> {
            /**Saves generated PDF report bytes as an artifact.*/
            const reportArtifact: Part = createPartFromBase64(reportBytes.toString('base64'), "application/pdf");

            const filename = "generated_report.pdf";

            try {
                const version = await context.saveArtifact(filename, reportArtifact);
                console.log(`Successfully saved TypeScript artifact '${filename}' as version ${version}.`);
            } catch (e: any) {
                console.error(`Error saving TypeScript artifact: ${e.message}. Is ArtifactService configured in Runner?`);
            }
        }
        ```
    === "Go"

        ```go
        import (
          "log"

          "google.golang.org/adk/agent"
          "google.golang.org/adk/llm"
          "google.golang.org/genai"
        )

        --8<-- "examples/go/snippets/artifacts/main.go:saving-artifacts"
        ```

    === "Java"

        ```java
        import com.google.adk.agents.CallbackContext;
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.adk.artifacts.InMemoryArtifactService;
        import com.google.genai.types.Part;
        import java.nio.charset.StandardCharsets;

        public class SaveArtifactExample {

        public void saveGeneratedReport(CallbackContext callbackContext, byte[] reportBytes) {
        // Saves generated PDF report bytes as an artifact.
        Part reportArtifact = Part.fromBytes(reportBytes, "application/pdf");
        String filename = "generatedReport.pdf";

            callbackContext.saveArtifact(filename, reportArtifact);
            System.out.println("Successfully saved Java artifact '" + filename);
            // The event generated after this callback will contain:
            // event().actions().artifactDelta == {"generated_report.pdf": version}
        }

        // --- Example Usage Concept (Java) ---
        public static void main(String[] args) {
            BaseArtifactService service = new InMemoryArtifactService(); // Or GcsArtifactService
            SaveArtifactExample myTool = new SaveArtifactExample();
            byte[] reportData = "...".getBytes(StandardCharsets.UTF_8); // PDF bytes
            CallbackContext callbackContext; // ... obtain callback context from your app
            myTool.saveGeneratedReport(callbackContext, reportData);
            // Due to async nature, in a real app, ensure program waits or handles completion.
          }
        }
        ```

#### Loading Artifacts

*   **Code Example:**

    === "Python"

        ```python
        import google.genai.types as types
        from google.adk.agents.callback_context import CallbackContext # Or ToolContext

        async def process_latest_report_py(context: CallbackContext):
            """Loads the latest report artifact and processes its data."""
            filename = "generated_report.pdf"
            try:
                # Load the latest version
                report_artifact = await context.load_artifact(filename=filename)

                if report_artifact and report_artifact.inline_data:
                    print(f"Successfully loaded latest Python artifact '{filename}'.")
                    print(f"MIME Type: {report_artifact.inline_data.mime_type}")
                    # Process the report_artifact.inline_data.data (bytes)
                    pdf_bytes = report_artifact.inline_data.data
                    print(f"Report size: {len(pdf_bytes)} bytes.")
                    # ... further processing ...
                else:
                    print(f"Python artifact '{filename}' not found.")

                # Example: Load a specific version (if version 0 exists)
                # specific_version_artifact = await context.load_artifact(filename=filename, version=0)
                # if specific_version_artifact:
                #     print(f"Loaded version 0 of '{filename}'.")

            except ValueError as e:
                print(f"Error loading Python artifact: {e}. Is ArtifactService configured?")
            except Exception as e:
                # Handle potential storage errors
                print(f"An unexpected error occurred during Python artifact load: {e}")

        # --- Example Usage Concept (Python) ---
        # async def main_py():
        #   callback_context: CallbackContext = ... # obtain context
        #   await process_latest_report_py(callback_context)
        ```

    === "Typescript"

        ```typescript
        import { CallbackContext } from '@google/adk';

        async function processLatestReport(context: CallbackContext): Promise<void> {
            /**Loads the latest report artifact and processes its data.*/
            const filename = "generated_report.pdf";
            try {
                // Load the latest version
                const reportArtifact = await context.loadArtifact(filename);

                if (reportArtifact?.inlineData) {
                    console.log(`Successfully loaded latest TypeScript artifact '${filename}'.`);
                    console.log(`MIME Type: ${reportArtifact.inlineData.mimeType}`);
                    // Process the reportArtifact.inlineData.data (base64 string)
                    const pdfData = Buffer.from(reportArtifact.inlineData.data, 'base64');
                    console.log(`Report size: ${pdfData.length} bytes.`);
                    // ... further processing ...
                } else {
                    console.log(`TypeScript artifact '${filename}' not found.`);
                }

            } catch (e: any) {
                console.error(`Error loading TypeScript artifact: ${e.message}. Is ArtifactService configured?`);
            }
        }
        ```

    === "Go"

        ```go
        import (
          "log"

          "google.golang.org/adk/agent"
          "google.golang.org/adk/llm"
        )

        --8<-- "examples/go/snippets/artifacts/main.go:loading-artifacts"
        ```

    === "Java"

        ```java
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.genai.types.Part;
        import io.reactivex.rxjava3.core.MaybeObserver;
        import io.reactivex.rxjava3.disposables.Disposable;
        import java.util.Optional;

        public class MyArtifactLoaderService {

            private final BaseArtifactService artifactService;
            private final String appName;

            public MyArtifactLoaderService(BaseArtifactService artifactService, String appName) {
                this.artifactService = artifactService;
                this.appName = appName;
            }

            public void processLatestReportJava(String userId, String sessionId, String filename) {
                // Load the latest version by passing Optional.empty() for the version
                artifactService
                        .loadArtifact(appName, userId, sessionId, filename, Optional.empty())
                        .subscribe(
                                new MaybeObserver<Part>() {
                                    @Override
                                    public void onSubscribe(Disposable d) {
                                        // Optional: handle subscription
                                    }

                                    @Override
                                    public void onSuccess(Part reportArtifact) {
                                        System.out.println(
                                                "Successfully loaded latest Java artifact '" + filename + "'.");
                                        reportArtifact
                                                .inlineData()
                                                .ifPresent(
                                                        blob -> {
                                                            System.out.println(
                                                                    "MIME Type: " + blob.mimeType().orElse("N/A"));
                                                            byte[] pdfBytes = blob.data().orElse(new byte[0]);
                                                            System.out.println("Report size: " + pdfBytes.length + " bytes.");
                                                            // ... further processing of pdfBytes ...
                                                        });
                                    }

                                    @Override
                                    public void onError(Throwable e) {
                                        // Handle potential storage errors or other exceptions
                                        System.err.println(
                                                "An error occurred during Java artifact load for '"
                                                        + filename
                                                        + "': "
                                                        + e.getMessage());
                                    }

                                    @Override
                                    public void onComplete() {
                                        // Called if the artifact (latest version) is not found
                                        System.out.println("Java artifact '" + filename + "' not found.");
                                    }
                                });

                // Example: Load a specific version (e.g., version 0)
                /*
                artifactService.loadArtifact(appName, userId, sessionId, filename, Optional.of(0))
                    .subscribe(part -> {
                        System.out.println("Loaded version 0 of Java artifact '" + filename + "'.");
                    }, throwable -> {
                        System.err.println("Error loading version 0 of '" + filename + "': " + throwable.getMessage());
                    }, () -> {
                        System.out.println("Version 0 of Java artifact '" + filename + "' not found.");
                    });
                */
            }

            // --- Example Usage Concept (Java) ---
            public static void main(String[] args) {
                // BaseArtifactService service = new InMemoryArtifactService(); // Or GcsArtifactService
                // MyArtifactLoaderService loader = new MyArtifactLoaderService(service, "myJavaApp");
                // loader.processLatestReportJava("user123", "sessionABC", "java_report.pdf");
                // Due to async nature, in a real app, ensure program waits or handles completion.
            }
        }
        ```

#### Listing Artifact Filenames

*   **Code Example:**

    === "Python"

        ```python
        from google.adk.tools.tool_context import ToolContext

        def list_user_files_py(tool_context: ToolContext) -> str:
            """Tool to list available artifacts for the user."""
            try:
                available_files = await tool_context.list_artifacts()
                if not available_files:
                    return "You have no saved artifacts."
                else:
                    # Format the list for the user/LLM
                    file_list_str = "\n".join([f"- {fname}" for fname in available_files])
                    return f"Here are your available Python artifacts:\n{file_list_str}"
            except ValueError as e:
                print(f"Error listing Python artifacts: {e}. Is ArtifactService configured?")
                return "Error: Could not list Python artifacts."
            except Exception as e:
                print(f"An unexpected error occurred during Python artifact list: {e}")
                return "Error: An unexpected error occurred while listing Python artifacts."

        # This function would typically be wrapped in a FunctionTool
        # from google.adk.tools import FunctionTool
        # list_files_tool = FunctionTool(func=list_user_files_py)
        ```

    === "Typescript"

        ```typescript
        import { ToolContext } from '@google/adk';

        async function listUserFiles(toolContext: ToolContext): Promise<string> {
            /**Tool to list available artifacts for the user.*/
            try {
                const availableFiles = await toolContext.listArtifacts();
                if (!availableFiles || availableFiles.length === 0) {
                    return "You have no saved artifacts.";
                } else {
                    // Format the list for the user/LLM
                    const fileListStr = availableFiles.map(fname => `- ${fname}`).join("\n");
                    return `Here are your available TypeScript artifacts:\n${fileListStr}`;
                }
            } catch (e: any) {
                console.error(`Error listing TypeScript artifacts: ${e.message}. Is ArtifactService configured?`);
                return "Error: Could not list TypeScript artifacts.";
            }
        }
        ```

    === "Go"

        ```go
        import (
          "fmt"
          "log"
          "strings"

          "google.golang.org/adk/agent"
          "google.golang.org/adk/llm"
          "google.golang.org/genai"
        )

        --8<-- "examples/go/snippets/artifacts/main.go:listing-artifacts"
        ```

    === "Java"

        ```java
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.adk.artifacts.ListArtifactsResponse;
        import com.google.common.collect.ImmutableList;
        import io.reactivex.rxjava3.core.SingleObserver;
        import io.reactivex.rxjava3.disposables.Disposable;

        public class MyArtifactListerService {

            private final BaseArtifactService artifactService;
            private final String appName;

            public MyArtifactListerService(BaseArtifactService artifactService, String appName) {
                this.artifactService = artifactService;
                this.appName = appName;
            }

            // Example method that might be called by a tool or agent logic
            public void listUserFilesJava(String userId, String sessionId) {
                artifactService
                        .listArtifactKeys(appName, userId, sessionId)
                        .subscribe(
                                new SingleObserver<ListArtifactsResponse>() {
                                    @Override
                                    public void onSubscribe(Disposable d) {
                                        // Optional: handle subscription
                                    }

                                    @Override
                                    public void onSuccess(ListArtifactsResponse response) {
                                        ImmutableList<String> availableFiles = response.filenames();
                                        if (availableFiles.isEmpty()) {
                                            System.out.println(
                                                    "User "
                                                            + userId
                                                            + " in session "
                                                            + sessionId
                                                            + " has no saved Java artifacts.");
                                        } else {
                                            StringBuilder fileListStr =
                                                    new StringBuilder(
                                                            "Here are the available Java artifacts for user "
                                                                    + userId
                                                                    + " in session "
                                                                    + sessionId
                                                                    + ":\n");
                                            for (String fname : availableFiles) {
                                                fileListStr.append("- ").append(fname).append("\n");
                                            }
                                            System.out.println(fileListStr.toString());
                                        }
                                    }

                                    @Override
                                    public void onError(Throwable e) {
                                        System.err.println(
                                                "Error listing Java artifacts for user "
                                                        + userId
                                                        + " in session "
                                                        + sessionId
                                                        + ": "
                                                        + e.getMessage());
                                        // In a real application, you might return an error message to the user/LLM
                                    }
                                });
            }

            // --- Example Usage Concept (Java) ---
            public static void main(String[] args) {
                // BaseArtifactService service = new InMemoryArtifactService(); // Or GcsArtifactService
                // MyArtifactListerService lister = new MyArtifactListerService(service, "myJavaApp");
                // lister.listUserFilesJava("user123", "sessionABC");
                // Due to async nature, in a real app, ensure program waits or handles completion.
            }
        }
        ```

These methods for saving, loading, and listing provide a convenient and consistent way to manage binary data persistence within ADK, whether using Python's context objects or directly interacting with the `BaseArtifactService` in Java, regardless of the chosen backend storage implementation.

## Available Implementations

ADK provides concrete implementations of the `BaseArtifactService` interface, offering different storage backends suitable for various development stages and deployment needs. These implementations handle the details of storing, versioning, and retrieving artifact data based on the `app_name`, `user_id`, `session_id`, and `filename` (including the `user:` namespace prefix).

### InMemoryArtifactService

*   **Storage Mechanism:**
    *   Python: Uses a Python dictionary (`self.artifacts`) held in the application's memory. The dictionary keys represent the artifact path, and the values are lists of `types.Part`, where each list element is a version.
    *   Java: Uses nested `HashMap` instances (`private final Map<String, Map<String, Map<String, Map<String, List<Part>>>>> artifacts;`) held in memory. The keys at each level are `appName`, `userId`, `sessionId`, and `filename` respectively. The innermost `List<Part>` stores the versions of the artifact, where the list index corresponds to the version number.
*   **Key Features:**
    *   **Simplicity:** Requires no external setup or dependencies beyond the core ADK library.
    *   **Speed:** Operations are typically very fast as they involve in-memory map/dictionary lookups and list manipulations.
    *   **Ephemeral:** All stored artifacts are **lost** when the application process terminates. Data does not persist between application restarts.
*   **Use Cases:**
    *   Ideal for local development and testing where persistence is not required.
    *   Suitable for short-lived demonstrations or scenarios where artifact data is purely temporary within a single run of the application.
*   **Instantiation:**

    === "Python"

        ```python
        from google.adk.artifacts import InMemoryArtifactService

        # Simply instantiate the class
        in_memory_service_py = InMemoryArtifactService()

        # Then pass it to the Runner
        # runner = Runner(..., artifact_service=in_memory_service_py)
        ```

    === "Typescript"

        ```typescript
        import { InMemoryArtifactService } from '@google/adk';

        // Simply instantiate the class
        const inMemoryService = new InMemoryArtifactService();

        // This instance would then be provided to your Runner.
        // const runner = new InMemoryRunner({
        //     /* other services */,
        //     artifactService: inMemoryService
        // });
        ```

    === "Go"

        ```go
        import (
          "google.golang.org/adk/artifactservice"
        )

        --8<-- "examples/go/snippets/artifacts/main.go:in-memory-service"
        ```

    === "Java"

        ```java
        import com.google.adk.artifacts.BaseArtifactService;
        import com.google.adk.artifacts.InMemoryArtifactService;

        public class InMemoryServiceSetup {
            public static void main(String[] args) {
                // Simply instantiate the class
                BaseArtifactService inMemoryServiceJava = new InMemoryArtifactService();

                System.out.println("InMemoryArtifactService (Java) instantiated: " + inMemoryServiceJava.getClass().getName());

                // This instance would then be provided to your Runner.
                // Runner runner = new Runner(
                //     /* other services */,
                //     inMemoryServiceJava
                // );
            }
        }
        ```

### GcsArtifactService


*   **Storage Mechanism:** Leverages Google Cloud Storage (GCS) for persistent artifact storage. Each version of an artifact is stored as a separate object (blob) within a specified GCS bucket.
*   **Object Naming Convention:** It constructs GCS object names (blob names) using a hierarchical path structure.
*   **Key Features:**
    *   **Persistence:** Artifacts stored in GCS persist across application restarts and deployments.
    *   **Scalability:** Leverages the scalability and durability of Google Cloud Storage.
    *   **Versioning:** Explicitly stores each version as a distinct GCS object. The `saveArtifact` method in `GcsArtifactService`.
    *   **Permissions Required:** The application environment needs appropriate credentials (e.g., Application Default Credentials) and IAM permissions to read from and write to the specified GCS bucket.
*   **Use Cases:**
    *   Production environments requiring persistent artifact storage.
    *   Scenarios where artifacts need to be shared across different application instances or services (by accessing the same GCS bucket).
    *   Applications needing long-term storage and retrieval of user or session data.
*   **Instantiation:**

    === "Python"

        ```python
        from google.adk.artifacts import GcsArtifactService

        # Specify the GCS bucket name
        gcs_bucket_name_py = "your-gcs-bucket-for-adk-artifacts" # Replace with your bucket name

        try:
            gcs_service_py = GcsArtifactService(bucket_name=gcs_bucket_name_py)
            print(f"Python GcsArtifactService initialized for bucket: {gcs_bucket_name_py}")
            # Ensure your environment has credentials to access this bucket.
            # e.g., via Application Default Credentials (ADC)

            # Then pass it to the Runner
            # runner = Runner(..., artifact_service=gcs_service_py)

        except Exception as e:
            # Catch potential errors during GCS client initialization (e.g., auth issues)
            print(f"Error initializing Python GcsArtifactService: {e}")
            # Handle the error appropriately - maybe fall back to InMemory or raise
        ```

    === "Java"

        ```java
        --8<-- "examples/java/snippets/src/main/java/artifacts/GcsServiceSetup.java:full_code"
        ```

Choosing the appropriate `ArtifactService` implementation depends on your application's requirements for data persistence, scalability, and operational environment.

## Best Practices

To use artifacts effectively and maintainably:

* **Choose the Right Service:** Use `InMemoryArtifactService` for rapid prototyping, testing, and scenarios where persistence isn't needed. Use `GcsArtifactService` (or implement your own `BaseArtifactService` for other backends) for production environments requiring data persistence and scalability.
* **Meaningful Filenames:** Use clear, descriptive filenames. Including relevant extensions (`.pdf`, `.png`, `.wav`) helps humans understand the content, even though the `mime_type` dictates programmatic handling. Establish conventions for temporary vs. persistent artifact names.
* **Specify Correct MIME Types:** Always provide an accurate `mime_type` when creating the `types.Part` for `save_artifact`. This is critical for applications or tools that later `load_artifact` to interpret the `bytes` data correctly. Use standard IANA MIME types where possible.
* **Understand Versioning:** Remember that `load_artifact()` without a specific `version` argument retrieves the *latest* version. If your logic depends on a specific historical version of an artifact, be sure to provide the integer version number when loading.
* **Use Namespacing (`user:`) Deliberately:** Only use the `"user:"` prefix for filenames when the data truly belongs to the user and should be accessible across all their sessions. For data specific to a single conversation or session, use regular filenames without the prefix.
* **Error Handling:**
    * Always check if an `artifact_service` is actually configured before calling context methods (`save_artifact`, `load_artifact`, `list_artifacts`) – they will raise a `ValueError` if the service is `None`.
    * Check the return value of `load_artifact`, as it will be `None` if the artifact or version doesn't exist. Don't assume it always returns a `Part`.
    * Be prepared to handle exceptions from the underlying storage service, especially with `GcsArtifactService` (e.g., `google.api_core.exceptions.Forbidden` for permission issues, `NotFound` if the bucket doesn't exist, network errors).
* **Size Considerations:** Artifacts are suitable for typical file sizes, but be mindful of potential costs and performance impacts with extremely large files, especially with cloud storage. `InMemoryArtifactService` can consume significant memory if storing many large artifacts. Evaluate if very large data might be better handled through direct GCS links or other specialized storage solutions rather than passing entire byte arrays in-memory.
* **Cleanup Strategy:** For persistent storage like `GcsArtifactService`, artifacts remain until explicitly deleted. If artifacts represent temporary data or have a limited lifespan, implement a strategy for cleanup. This might involve:
    * Using GCS lifecycle policies on the bucket.
    * Building specific tools or administrative functions that utilize the `artifact_service.delete_artifact` method (note: delete is *not* exposed via context objects for safety).
    * Carefully managing filenames to allow pattern-based deletion if needed.
    # Loop agents

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.1.0</span><span class="lst-typescript">Typescript v0.2.0</span><span class="lst-go">Go v0.1.0</span><span class="lst-java">Java v0.2.0</span>
</div>

The `LoopAgent` is a workflow agent that executes its sub-agents in a loop (i.e. iteratively). It **_repeatedly runs_ a sequence of agents** for a specified number of iterations or until a termination condition is met.

Use the `LoopAgent` when your workflow involves repetition or iterative refinement, such as revising code.

### Example

* You want to build an agent that can generate images of food, but sometimes when you want to generate a specific number of items (e.g. 5 bananas), it generates a different number of those items in the image (e.g. an image of 7 bananas). You have two tools: `Generate Image`, `Count Food Items`. Because you want to keep generating images until it either correctly generates the specified number of items, or after a certain number of iterations, you should build your agent using a `LoopAgent`.

As with other [workflow agents](index.md), the `LoopAgent` is not powered by an LLM, and is thus deterministic in how it executes. That being said, workflow agents are only concerned only with their execution (i.e. in a loop), and not their internal logic; the tools or sub-agents of a workflow agent may or may not utilize LLMs.

### How it Works

When the `LoopAgent`'s `Run Async` method is called, it performs the following actions:

1. **Sub-Agent Execution:**  It iterates through the Sub Agents list _in order_. For _each_ sub-agent, it calls the agent's `Run Async` method.
2. **Termination Check:**

    _Crucially_, the `LoopAgent` itself does _not_ inherently decide when to stop looping. You _must_ implement a termination mechanism to prevent infinite loops.  Common strategies include:

    * **Max Iterations**: Set a maximum number of iterations in the `LoopAgent`. **The loop will terminate after that many iterations**.
    * **Escalation from sub-agent**: Design one or more sub-agents to evaluate a condition (e.g., "Is the document quality good enough?", "Has a consensus been reached?").  If the condition is met, the sub-agent can signal termination (e.g., by raising a custom event, setting a flag in a shared context, or returning a specific value).

![Loop Agent](../../assets/loop-agent.png)

### Full Example: Iterative Document Improvement

Imagine a scenario where you want to iteratively improve a document:

* **Writer Agent:** An `LlmAgent` that generates or refines a draft on a topic.
* **Critic Agent:** An `LlmAgent` that critiques the draft, identifying areas for improvement.

    ```py
    LoopAgent(sub_agents=[WriterAgent, CriticAgent], max_iterations=5)
    ```

In this setup, the `LoopAgent` would manage the iterative process.  The `CriticAgent` could be **designed to return a "STOP" signal when the document reaches a satisfactory quality level**, preventing further iterations. Alternatively, the `max iterations` parameter could be used to limit the process to a fixed number of cycles, or external logic could be implemented to make stop decisions. The **loop would run at most five times**, ensuring the iterative refinement doesn't continue indefinitely.

???+ "Full Code"

    === "Python"
        ```py
        --8<-- "examples/python/snippets/agents/workflow-agents/loop_agent_doc_improv_agent.py:init"
        ```

    === "Typescript"
        ```typescript
        --8<-- "examples/typescript/snippets/agents/workflow-agents/loop_agent_doc_improv_agent.ts:init"
        ```

    === "Go"
        ```go
        --8<-- "examples/go/snippets/agents/workflow-agents/loop/main.go:init"
        ```

    === "Java"
        ```java
        --8<-- "examples/java/snippets/src/main/java/agents/workflow/LoopAgentExample.java:init"
    # Parallel agents

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.1.0</span><span class="lst-typescript">Typescript v0.2.0</span><span class="lst-go">Go v0.1.0</span><span class="lst-java">Java v0.2.0</span>
</div>

The `ParallelAgent` is a [workflow agent](index.md) that executes its sub-agents *concurrently*. This dramatically speeds up workflows where tasks can be performed independently.

Use `ParallelAgent` when: For scenarios prioritizing speed and involving independent, resource-intensive tasks, a `ParallelAgent` facilitates efficient parallel execution. **When sub-agents operate without dependencies, their tasks can be performed concurrently**, significantly reducing overall processing time.

As with other [workflow agents](index.md), the `ParallelAgent` is not powered by an LLM, and is thus deterministic in how it executes. That being said, workflow agents are only concerned with their execution (i.e. executing sub-agents in parallel), and not their internal logic; the tools or sub-agents of a workflow agent may or may not utilize LLMs.

### Example

This approach is particularly beneficial for operations like multi-source data retrieval or heavy computations, where parallelization yields substantial performance gains. Importantly, this strategy assumes no inherent need for shared state or direct information exchange between the concurrently executing agents.

### How it works

When the `ParallelAgent`'s `run_async()` method is called:

1. **Concurrent Execution:** It initiates the `run_async()` method of *each* sub-agent present in the `sub_agents` list *concurrently*.  This means all the agents start running at (approximately) the same time.
2. **Independent Branches:**  Each sub-agent operates in its own execution branch.  There is ***no* automatic sharing of conversation history or state between these branches** during execution.
3. **Result Collection:** The `ParallelAgent` manages the parallel execution and, typically, provides a way to access the results from each sub-agent after they have completed (e.g., through a list of results or events). The order of results may not be deterministic.

### Independent Execution and State Management

It's *crucial* to understand that sub-agents within a `ParallelAgent` run independently.  If you *need* communication or data sharing between these agents, you must implement it explicitly.  Possible approaches include:

* **Shared `InvocationContext`:** You could pass a shared `InvocationContext` object to each sub-agent.  This object could act as a shared data store.  However, you'd need to manage concurrent access to this shared context carefully (e.g., using locks) to avoid race conditions.
* **External State Management:**  Use an external database, message queue, or other mechanism to manage shared state and facilitate communication between agents.
* **Post-Processing:** Collect results from each branch, and then implement logic to coordinate data afterwards.

![Parallel Agent](../../assets/parallel-agent.png){: width="600"}

### Full Example: Parallel Web Research

Imagine researching multiple topics simultaneously:

1. **Researcher Agent 1:**  An `LlmAgent` that researches "renewable energy sources."
2. **Researcher Agent 2:**  An `LlmAgent` that researches "electric vehicle technology."
3. **Researcher Agent 3:**  An `LlmAgent` that researches "carbon capture methods."

    ```py
    ParallelAgent(sub_agents=[ResearcherAgent1, ResearcherAgent2, ResearcherAgent3])
    ```

These research tasks are independent.  Using a `ParallelAgent` allows them to run concurrently, potentially reducing the total research time significantly compared to running them sequentially. The results from each agent would be collected separately after they finish.

???+ "Full Code"

    === "Python"
        ```py
         --8<-- "examples/python/snippets/agents/workflow-agents/parallel_agent_web_research.py:init"
        ```

    === "Typescript"
        ```typescript
         --8<-- "examples/typescript/snippets/agents/workflow-agents/parallel_agent_web_research.ts:init"
        ```

    === "Go"
        ```go
         --8<-- "examples/go/snippets/agents/workflow-agents/parallel/main.go:init"
        ```

    === "Java"
        ```java
         --8<-- "examples/java/snippets/src/main/java/agents/workflow/ParallelResearchPipeline.java:full_code"
        ```
        # Build agents with Agent Config

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v1.11.0</span><span class="lst-preview">Experimental</span>
</div>

The ADK Agent Config feature lets you build an ADK workflow without writing
code. An Agent Config uses a YAML format text file with a brief description of
the agent, allowing just about anyone to assemble and run an ADK agent. The
following is a simple example of an basic Agent Config definition:

```
name: assistant_agent
model: gemini-2.5-flash
description: A helper agent that can answer users' questions.
instruction: You are an agent to help answer users' various questions.
```

You can use Agent Config files to build more complex agents which can
incorporate Functions, Tools, Sub-Agents, and more. This page describes how to
build and run ADK workflows with the Agent Config feature. For detailed
information on the syntax and settings supported by the Agent Config format,
see the
[Agent Config syntax reference](/adk-docs/api-reference/agentconfig/).

!!! example "Experimental"
    The Agent Config feature is experimental and has some
    [known limitations](#known-limitations). We welcome your
    [feedback](https://github.com/google/adk-python/issues/new?template=feature_request.md&labels=agent%20config)!

## Get started

This section describes how to set up and start building agents with the ADK and
the Agent Config feature, including installation setup, building an agent, and
running your agent.

### Setup

You need to install the Google Agent Development Kit libraries, and provide an
access key for a generative AI model such as Gemini API. This section provides
details on what you must install and configure before you can run agents with
the Agent Config files.

!!! note
    The Agent Config feature currently only supports Gemini models. For more
    information about additional; functional restrictions, see
    [Known limitations](#known-limitations).

To setup ADK for use with Agent Config:

1.  Install the ADK Python libraries by following the
    [Installation](/adk-docs/get-started/installation/#python)
    instructions. *Python is currently required.* For more information, see the
    [Known limitations](#known-limitations).
1.  Verify that ADK is installed by running the following command in your
    terminal:

        adk --version

    This command should show the ADK version you have installed.

!!! Tip
    If the `adk` command fails to run and the version is not listed in step 2, make
    sure your Python environment is active. Execute `source .venv/bin/activate` in
    your terminal on Mac and Linux. For other platform commands, see the
    [Installation](/adk-docs/get-started/installation/#python)
    page.

### Build an agent

You build an agent with Agent Config using the `adk create` command to create
the project files for an agent, and then editing the `root_agent.yaml` file it
generates for you.

To create an ADK project for use with Agent Config:

1.  In your terminal window, run the following command to create a
    config-based agent:

        adk create --type=config my_agent

    This command generates a `my_agent/` folder, containing a
    `root_agent.yaml` file and an `.env` file.

1.  In the `my_agent/.env` file, set environment variables for your agent to
    access generative AI models and other services:

    1.  For Gemini model access through Google API, add a line to the
        file with your API key:

            GOOGLE_GENAI_USE_VERTEXAI=0
            GOOGLE_API_KEY=<your-Google-Gemini-API-key>

        You can get an API key from the Google AI Studio
        [API Keys](https://aistudio.google.com/app/apikey) page.

    1.  For Gemini model access through Google Cloud, add these lines to the file:

            GOOGLE_GENAI_USE_VERTEXAI=1
            GOOGLE_CLOUD_PROJECT=<your_gcp_project>
            GOOGLE_CLOUD_LOCATION=us-central1

        For information on creating a Cloud Project, see the Google Cloud docs
        for
        [Creating and managing projects](https://cloud.google.com/resource-manager/docs/creating-managing-projects).

1.  Using text editor, edit the Agent Config file
    `my_agent/root_agent.yaml`, as shown below:

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
name: assistant_agent
model: gemini-2.5-flash
description: A helper agent that can answer users' questions.
instruction: You are an agent to help answer users' various questions.
```

You can discover more configuration options for your `root_agent.yaml` agent
configuration file by referring to the ADK
[samples repository](https://github.com/search?q=repo%3Agoogle%2Fadk-python+path%3A%2F%5Econtributing%5C%2Fsamples%5C%2F%2F+.yaml&type=code)
or the
[Agent Config syntax](/adk-docs/api-reference/agentconfig/)
reference.

### Run the agent

Once you have completed editing your Agent Config, you can run your agent using
the web interface, command line terminal execution, or API server mode.

To run your Agent Config-defined agent:

1.  In your terminal, navigate to the `my_agent/` directory containing the
    `root_agent.yaml` file.
1.  Type one of the following commands to run your agent:
    -   `adk web` - Run web UI interface for your agent.
    -   `adk run` - Run your agent in the terminal without a user
        interface.
    -   `adk api_server` - Run your agent as a service that can be
        used by other applications.

For more information on the ways to run your agent, see the *Run Your Agent*
topic in the
[Quickstart](/adk-docs/get-started/quickstart/#run-your-agent).
For more information about the ADK command line options, see the
[ADK CLI reference](/adk-docs/api-reference/cli/).

## Example configs

This section shows examples of Agent Config files to get you started building
agents. For additional and more complete examples, see the ADK
[samples repository](https://github.com/search?q=repo%3Agoogle%2Fadk-python+path%3A%2F%5Econtributing%5C%2Fsamples%5C%2F%2F+root_agent.yaml&type=code).

### Built-in tool example

The following example uses a built-in ADK tool function for using google search
to provide functionality to the agent. This agent automatically uses the search
tool to reply to user requests.

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
name: search_agent
model: gemini-2.0-flash
description: 'an agent whose job it is to perform Google search queries and answer questions about the results.'
instruction: You are an agent whose job is to perform Google search queries and answer questions about the results.
tools:
  - name: google_search
```

For more details, see the full code for this sample in the
[ADK sample repository](https://github.com/google/adk-python/blob/main/contributing/samples/tool_builtin_config/root_agent.yaml).

### Custom tool example

The following example uses a custom tool built with Python code and listed in
the `tools:` section of the config file. The agent uses this tool to check if a
list of numbers provided by the user are prime numbers.

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
agent_class: LlmAgent
model: gemini-2.5-flash
name: prime_agent
description: Handles checking if numbers are prime.
instruction: |
  You are responsible for checking whether numbers are prime.
  When asked to check primes, you must call the check_prime tool with a list of integers.
  Never attempt to determine prime numbers manually.
  Return the prime number results to the root agent.
tools:
  - name: ma_llm.check_prime
```

For more details, see the full code for this sample in the
[ADK sample repository](https://github.com/google/adk-python/blob/main/contributing/samples/multi_agent_llm_config/prime_agent.yaml).

### Sub-agents example

The following example shows an agent defined with two sub-agents in the
`sub_agents:` section, and an example tool in the `tools:` section of the config
file. This agent determines what the user wants, and delegates to one of the
sub-agents to resolve the request. The sub-agents are defined using Agent Config
YAML files.

```
# yaml-language-server: $schema=https://raw.githubusercontent.com/google/adk-python/refs/heads/main/src/google/adk/agents/config_schemas/AgentConfig.json
agent_class: LlmAgent
model: gemini-2.5-flash
name: root_agent
description: Learning assistant that provides tutoring in code and math.
instruction: |
  You are a learning assistant that helps students with coding and math questions.

  You delegate coding questions to the code_tutor_agent and math questions to the math_tutor_agent.

  Follow these steps:
  1. If the user asks about programming or coding, delegate to the code_tutor_agent.
  2. If the user asks about math concepts or problems, delegate to the math_tutor_agent.
  3. Always provide clear explanations and encourage learning.
sub_agents:
  - config_path: code_tutor_agent.yaml
  - config_path: math_tutor_agent.yaml
```

For more details, see the full code for this sample in the
[ADK sample repository](https://github.com/google/adk-python/blob/main/contributing/samples/multi_agent_basic_config/root_agent.yaml).

## Deploy agent configs

You can deploy Agent Config agents with
[Cloud Run](/adk-docs/deploy/cloud-run/) and
[Agent Engine](/adk-docs/deploy/agent-engine/),
using the same procedure as code-based agents. For more information on how
to prepare and deploy Agent Config-based agents, see the
[Cloud Run](/adk-docs/deploy/cloud-run/) and
[Agent Engine](/adk-docs/deploy/agent-engine/)
deployment guides.

## Known limitations {#known-limitations}

The Agent Config feature is experimental and includes the following
limitations:

-   **Model support:** Only Gemini models are currently supported.
    Integration with third-party models is in progress.
-   **Programming language:** The Agent Config feature currently supports
    only Python code for tools and other functionality requiring programming code.
-   **ADK Tool support:** The following ADK tools are supported by the Agent
    Config feature, but *not all tools are fully supported*:
    -   `google_search`
    -   `load_artifacts`
    -   `url_context`
    -   `exit_loop`
    -   `preload_memory`
    -   `get_user_choice`
    -   `enterprise_web_search`
    -   `load_web_page`: Requires a fully-qualified path to access web
        pages.
-   **Agent Type Support:** The `LangGraphAgent` and `A2aAgent` types are
    not yet supported.
    -   `AgentTool`
    -   `LongRunningFunctionTool`
    -   `VertexAiSearchTool`
    -   `McpToolset`
    -   `ExampleTool`

## Next steps

For ideas on how and what to build with ADK Agent Configs, see the yaml-based
agent definitions in the ADK
[adk-samples](https://github.com/search?q=repo:google/adk-python+path:/%5Econtributing%5C/samples%5C//+root_agent.yaml&type=code)
repository. For detailed information on the syntax and settings supported by
the Agent Config format, see the
[Agent Config syntax reference](/adk-docs/api-reference/agentconfig/).
# Using Different Models with ADK

<div class="language-support-tag" title="Java ADK currently supports Gemini and Anthropic models.">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.1.0</span><span class="lst-typescript">Typescript v0.2.0</span><span class="lst-go">Go v0.1.0</span><span class="lst-java">Java v0.1.0</span>
</div>

The Agent Development Kit (ADK) is designed for flexibility, allowing you to
integrate various Large Language Models (LLMs) into your agents. While the setup
for Google Gemini models is covered in the
[Setup Foundation Models](../get-started/installation.md) guide, this page
details how to leverage Gemini effectively and integrate other popular models,
including those hosted externally or running locally.

ADK primarily uses two mechanisms for model integration:

1. **Direct String / Registry:** For models tightly integrated with Google Cloud
   (like Gemini models accessed via Google AI Studio or Vertex AI) or models
   hosted on Vertex AI endpoints. You typically provide the model name or
   endpoint resource string directly to the `LlmAgent`. ADK's internal registry
   resolves this string to the appropriate backend client, often utilizing the
   `google-genai` library.
2. **Wrapper Classes:** For broader compatibility, especially with models
   outside the Google ecosystem or those requiring specific client
   configurations (like models accessed via Apigee or LiteLLM). You instantiate a specific
   wrapper class (e.g., `ApigeeLlm` or `LiteLlm`) and pass this object as the `model` parameter
   to your `LlmAgent`.

The following sections guide you through using these methods based on your needs.

## Google Gemini models

ADK supports the Google Gemini family of generative AI models that provide a
powerful set of models with a wide range of features. ADK provides support for many
Gemini features, including
[Code Execution](/adk-docs/tools/built-in-tools/#code-execution),
[Google Search](/adk-docs/tools/built-in-tools/#google-search),
[Context caching](/adk-docs/context/caching/),
[Computer use](/adk-docs/tools/gemini-api/computer-use/)
and the [Interactions API](#interactions-api).

### Gemini Interactions API {#interactions-api}

<div class="language-support-tag" title="Java ADK currently supports Gemini and Anthropic models.">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v1.21.0</span>
</div>

The Gemini [Interactions API](https://ai.google.dev/gemini-api/docs/interactions)
is an alternative to the ***generateContent*** inference API, which provides
stateful conversation capabilities, allowing you to chain interactions using a
`previous_interaction_id` instead of sending the full conversation history with
each request. Using this feature can be more efficient for long conversations.

You can enable the Interactions API by settting the `use_interactions_api=True`
parameter in the Gemini model configuration, as shown in the following code
snippet:

```python
from google.adk.agents.llm_agent import Agent
from google.adk.models.google_llm import Gemini
from google.adk.tools.google_search_tool import GoogleSearchTool

root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        use_interactions_api=True,  # Enable Interactions API
    ),
    name="interactions_test_agent",
    tools=[
        GoogleSearchTool(bypass_multi_tools_limit=True),  # Converted to function tool
        get_current_weather,  # Custom function tool
    ],
)
```

For a complete code sample, see the
[Interactions API sample](https://github.com/google/adk-python/tree/main/contributing/samples/interactions_api).

#### Known limitations

The Interactions API **does not** support mixing custom function calling tools with
built-in tools, such as the
[Google Search](/adk-docs/tools/built-in-tools/#google-search),
tool, within the same agent. You can work around this limitation by configuring the
the built-in tool to operate as a custom tool using the `bypass_multi_tools_limit`
parameter:

```python
# Use bypass_multi_tools_limit=True to convert google_search to a function tool
GoogleSearchTool(bypass_multi_tools_limit=True)
```

In this example, this option converts the built-in google_search to a function
calling tool (via GoogleSearchAgentTool), which allows it to work alongside
custom function tools.

## Gemini model authentication

This section covers authenticating with Google's Gemini models, either through Google AI Studio for rapid development or Google Cloud Vertex AI for enterprise applications. This is the most direct way to use Google's flagship models within ADK.

**Integration Method:** Once you are authenticated using one of the below methods, you can pass the model's identifier string directly to the
`model` parameter of `LlmAgent`.


!!! tip

    The `google-genai` library, used internally by ADK for Gemini models, can connect
    through either Google AI Studio or Vertex AI.

    **Model support for voice/video streaming**

    In order to use voice/video streaming in ADK, you will need to use Gemini
    models that support the Live API. You can find the **model ID(s)** that
    support the Gemini Live API in the documentation:

    - [Google AI Studio: Gemini Live API](https://ai.google.dev/gemini-api/docs/models#live-api)
    - [Vertex AI: Gemini Live API](https://cloud.google.com/vertex-ai/generative-ai/docs/live-api)

### Google AI Studio

This is the simplest method and is recommended for getting started quickly.

*   **Authentication Method:** API Key
*   **Setup:**
    1.  **Get an API key:** Obtain your key from [Google AI Studio](https://aistudio.google.com/apikey).
    2.  **Set environment variables:** Create a `.env` file (Python) or `.properties` (Java) in your project's root directory and add the following lines. ADK will automatically load this file.

        ```shell
        export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
        export GOOGLE_GENAI_USE_VERTEXAI=FALSE
        ```

        (or)

        Pass these variables during the model initialization via the `Client` (see example below).

* **Models:** Find all available models on the
  [Google AI for Developers site](https://ai.google.dev/gemini-api/docs/models).

### Google Cloud Vertex AI

For scalable and production-oriented use cases, Vertex AI is the recommended platform. Gemini on Vertex AI supports enterprise-grade features, security, and compliance controls. Based on your development environment and usecase, *choose one of the below methods to authenticate*.

**Pre-requisites:** A Google Cloud Project with [Vertex AI enabled](https://console.cloud.google.com/apis/enableflow;apiid=aiplatform.googleapis.com).

### **Method A: User Credentials (for Local Development)**

1.  **Install the gcloud CLI:** Follow the official [installation instructions](https://cloud.google.com/sdk/docs/install).
2.  **Log in using ADC:** This command opens a browser to authenticate your user account for local development.
    ```bash
    gcloud auth application-default login
    ```
3.  **Set environment variables:**
    ```shell
    export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
    export GOOGLE_CLOUD_LOCATION="YOUR_VERTEX_AI_LOCATION" # e.g., us-central1
    ```

    Explicitly tell the library to use Vertex AI:

    ```shell
    export GOOGLE_GENAI_USE_VERTEXAI=TRUE
    ```

4. **Models:** Find available model IDs in the
  [Vertex AI documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models).

### **Method B: Vertex AI Express Mode**
[Vertex AI Express Mode](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview) offers a simplified, API-key-based setup for rapid prototyping.

1.  **Sign up for Express Mode** to get your API key.
2.  **Set environment variables:**
    ```shell
    export GOOGLE_API_KEY="PASTE_YOUR_EXPRESS_MODE_API_KEY_HERE"
    export GOOGLE_GENAI_USE_VERTEXAI=TRUE
    ```

### **Method C: Service Account (for Production & Automation)**

For deployed applications, a service account is the standard method.

1.  [**Create a Service Account**](https://cloud.google.com/iam/docs/service-accounts-create#console) and grant it the `Vertex AI User` role.
2.  **Provide credentials to your application:**
    *   **On Google Cloud:** If you are running the agent in Cloud Run, GKE, VM or other Google Cloud services, the environment can automatically provide the service account credentials. You don't have to create a key file.
    *   **Elsewhere:** Create a [service account key file](https://cloud.google.com/iam/docs/keys-create-delete#console) and point to it with an environment variable:
        ```bash
        export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"
        ```
    Instead of the key file, you can also authenticate the service account using Workload Identity. But this is outside the scope of this guide.

**Example:**

=== "Python"

    ```python
    from google.adk.agents import LlmAgent

    # --- Example using a stable Gemini Flash model ---
    agent_gemini_flash = LlmAgent(
        # Use the latest stable Flash model identifier
        model="gemini-2.0-flash",
        name="gemini_flash_agent",
        instruction="You are a fast and helpful Gemini assistant.",
        # ... other agent parameters
    )

    # --- Example using a powerful Gemini Pro model ---
    # Note: Always check the official Gemini documentation for the latest model names,
    # including specific preview versions if needed. Preview models might have
    # different availability or quota limitations.
    agent_gemini_pro = LlmAgent(
        # Use the latest generally available Pro model identifier
        model="gemini-2.5-pro-preview-03-25",
        name="gemini_pro_agent",
        instruction="You are a powerful and knowledgeable Gemini assistant.",
        # ... other agent parameters
    )
    ```

=== "Go"

    ```go
    import (
    	"google.golang.org/adk/agent/llmagent"
    	"google.golang.org/adk/model/gemini"
    	"google.golang.org/genai"
    )

    --8<-- "examples/go/snippets/agents/models/models.go:gemini-example"
    ```

=== "Java"

    ```java
    // --- Example #1: using a stable Gemini Flash model with ENV variables---
    LlmAgent agentGeminiFlash =
        LlmAgent.builder()
            // Use the latest stable Flash model identifier
            .model("gemini-2.0-flash") // Set ENV variables to use this model
            .name("gemini_flash_agent")
            .instruction("You are a fast and helpful Gemini assistant.")
            // ... other agent parameters
            .build();

    // --- Example #2: using a powerful Gemini Pro model with API Key in model ---
    LlmAgent agentGeminiPro =
        LlmAgent.builder()
            // Use the latest generally available Pro model identifier
            .model(new Gemini("gemini-2.5-pro-preview-03-25",
                Client.builder()
                    .vertexAI(false)
                    .apiKey("API_KEY") // Set the API Key (or) project/ location
                    .build()))
            // Or, you can also directly pass the API_KEY
            // .model(new Gemini("gemini-2.5-pro-preview-03-25", "API_KEY"))
            .name("gemini_pro_agent")
            .instruction("You are a powerful and knowledgeable Gemini assistant.")
            // ... other agent parameters
            .build();

    // Note: Always check the official Gemini documentation for the latest model names,
    // including specific preview versions if needed. Preview models might have
    // different availability or quota limitations.
    ```

!!! warning "Secure Your Credentials"

    Service account credentials or API keys are powerful credentials. Never
    expose them publicly. Use a secret manager such as [Google Cloud Secret
    Manager](https://cloud.google.com/security/products/secret-manager) to store
    and access them securely in production.

### Troubleshooting

#### Error Code 429 - RESOURCE_EXHAUSTED

This error usually happens if the number of your requests exceeds the capacity allocated to process requests.

To mitigate this, you can do one of the following:

1.  Request higher quota limits for the model you are trying to use.

2.  Enable client-side retries. Retries allow the client to automatically retry the request after a delay, which can help if the quota issue is temporary.

    There are two ways you can set retry options:

    **Option 1:** Set retry options on the Agent as a part of generate_content_config.

    You would use this option if you are instantiating this model adapter by
    yourself.

    ```python
    root_agent = Agent(
        model='gemini-2.0-flash',
        ...
        generate_content_config=types.GenerateContentConfig(
            ...
            http_options=types.HttpOptions(
                ...
                retry_options=types.HttpRetryOptions(initial_delay=1, attempts=2),
                ...
            ),
            ...
        )
    ```

    **Option 2:** Retry options on this model adapter.

    You would use this option if you were instantiating the instance of adapter
    by yourself.

    ```python
    from google.genai import types

    # ...

    agent = Agent(
        model=Gemini(
        retry_options=types.HttpRetryOptions(initial_delay=1, attempts=2),
        )
    )
    ```

## Using Anthropic models

<div class="language-support-tag" title="Available for Java. Python support for direct Anthropic API (non-Vertex) is via LiteLLM.">
   <span class="lst-supported">Supported in ADK</span><span class="lst-java">Java v0.2.0</span>
</div>

You can integrate Anthropic's Claude models directly using their API key or from a Vertex AI backend into your Java ADK applications by using the ADK's `Claude` wrapper class.

For Vertex AI backend, see the [Third-Party Models on Vertex AI](#third-party-models-on-vertex-ai-eg-anthropic-claude) section.

**Prerequisites:**

1.  **Dependencies:**
    *   **Anthropic SDK Classes (Transitive):** The Java ADK's `com.google.adk.models.Claude` wrapper relies on classes from Anthropic's official Java SDK. These are typically included as **transitive dependencies**.

2.  **Anthropic API Key:**
    *   Obtain an API key from Anthropic. Securely manage this key using a secret manager.

**Integration:**

Instantiate `com.google.adk.models.Claude`, providing the desired Claude model name and an `AnthropicOkHttpClient` configured with your API key. Then, pass this `Claude` instance to your `LlmAgent`.

**Example:**

```java
import com.anthropic.client.AnthropicClient;
import com.google.adk.agents.LlmAgent;
import com.google.adk.models.Claude;
import com.anthropic.client.okhttp.AnthropicOkHttpClient; // From Anthropic's SDK

public class DirectAnthropicAgent {

  private static final String CLAUDE_MODEL_ID = "claude-3-7-sonnet-latest"; // Or your preferred Claude model

  public static LlmAgent createAgent() {

    // It's recommended to load sensitive keys from a secure config
    AnthropicClient anthropicClient = AnthropicOkHttpClient.builder()
        .apiKey("ANTHROPIC_API_KEY")
        .build();

    Claude claudeModel = new Claude(
        CLAUDE_MODEL_ID,
        anthropicClient
    );

    return LlmAgent.builder()
        .name("claude_direct_agent")
        .model(claudeModel)
        .instruction("You are a helpful AI assistant powered by Anthropic Claude.")
        // ... other LlmAgent configurations
        .build();
  }

  public static void main(String[] args) {
    try {
      LlmAgent agent = createAgent();
      System.out.println("Successfully created direct Anthropic agent: " + agent.name());
    } catch (IllegalStateException e) {
      System.err.println("Error creating agent: " + e.getMessage());
    }
  }
}
```

## Using Apigee gateway for AI models

<div class="language-support-tag">
   <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v1.18.0</span><span class="lst-java">Java v0.4.0</span>
</div>

[Apigee](https://docs.cloud.google.com/apigee/docs/api-platform/get-started/what-apigee) acts as a powerful [AI Gateway](https://cloud.google.com/solutions/apigee-ai), transforming how you manage and govern your generative AI model traffic. By exposing your AI model endpoint (like Vertex AI or the Gemini API) through an Apigee proxy, you immediately gain enterprise-grade capabilities:

- **Model Safety:** Implement security policies like Model Armor for threat protection.

- **Traffic Governance:** Enforce Rate Limiting and Token Limiting to manage costs and prevent abuse.

- **Performance:** Improve response times and efficiency using Semantic Caching and advanced model routing.

- **Monitoring & Visibility:** Get granular monitoring, analysis, and auditing of all your AI requests.

**NOTE:** The `ApigeeLLM` wrapper is currently designed for use with Vertex AI and the Gemini API (generateContent). We are continually expanding support for other models and interfaces.

**Integration Method:**  To integrate Apigee's governance into your agent's workflow, simply instantiate the `ApigeeLlm` wrapper and pass it to an `LlmAgent` or other agent type.

**Example:**

=== "Python"

    ```python

    from google.adk.agents import LlmAgent
    from google.adk.models.apigee_llm import ApigeeLlm

    # Instantiate the ApigeeLlm wrapper
    model = ApigeeLlm(
        # Specify the Apigee route to your model. For more info, check out the ApigeeLlm documentation (https://github.com/google/adk-python/tree/main/contributing/samples/hello_world_apigeellm).
        model="apigee/gemini-2.5-flash",
        # The proxy URL of your deployed Apigee proxy including the base path
        proxy_url=f"https://{APIGEE_PROXY_URL}",
        # Pass necessary authentication/authorization headers (like an API key)
        custom_headers={"foo": "bar"}
    )

    # Pass the configured model wrapper to your LlmAgent
    agent = LlmAgent(
        model=model,
        name="my_governed_agent",
        instruction="You are a helpful assistant powered by Gemini and governed by Apigee.",
        # ... other agent parameters
    )

    ```

=== "Java"

    ```java
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.models.ApigeeLlm;
    import com.google.common.collect.ImmutableMap;

    ApigeeLlm apigeeLlm =
            ApigeeLlm.builder()
                .modelName("apigee/gemini-2.5-flash") // Specify the Apigee route to your model. For more info, check out the ApigeeLlm documentation
                .proxyUrl(APIGEE_PROXY_URL) //The proxy URL of your deployed Apigee proxy including the base path
                .customHeaders(ImmutableMap.of("foo", "bar")) //Pass necessary authentication/authorization headers (like an API key)
                .build();
    LlmAgent agent =
        LlmAgent.builder()
            .model(apigeeLlm)
            .name("my_governed_agent")
            .description("my_governed_agent")
            .instruction("You are a helpful assistant powered by Gemini and governed by Apigee.")
            // tools will be added next
            .build();
    ```

With this configuration, every API call from your agent will be routed through Apigee first, where all necessary policies (security, rate limiting, logging) are executed before the request is securely forwarded to the underlying AI model endpoint.

For a full code example using the Apigee proxy, see [Hello World Apigee LLM](https://github.com/google/adk-python/tree/main/contributing/samples/hello_world_apigeellm)

## Using Cloud & Proprietary Models via LiteLLM

<div class="language-support-tag">
    <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.1.0</span>
</div>

To access a vast range of LLMs from providers like OpenAI, Anthropic (non-Vertex
AI), Cohere, and many others, ADK offers integration through the LiteLLM
library.

**Integration Method:** Instantiate the `LiteLlm` wrapper class and pass it to
the `model` parameter of `LlmAgent`.

**LiteLLM Overview:** [LiteLLM](https://docs.litellm.ai/) acts as a translation
layer, providing a standardized, OpenAI-compatible interface to over 100+ LLMs.

**Setup:**

1. **Install LiteLLM:**
        ```shell
        pip install litellm
        ```
2. **Set Provider API Keys:** Configure API keys as environment variables for
   the specific providers you intend to use.

    * *Example for OpenAI:*

        ```shell
        export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
        ```

    * *Example for Anthropic (non-Vertex AI):*

        ```shell
        export ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
        ```

    * *Consult the
      [LiteLLM Providers Documentation](https://docs.litellm.ai/docs/providers)
      for the correct environment variable names for other providers.*

        **Example:**

        ```python
        from google.adk.agents import LlmAgent
        from google.adk.models.lite_llm import LiteLlm

        # --- Example Agent using OpenAI's GPT-4o ---
        # (Requires OPENAI_API_KEY)
        agent_openai = LlmAgent(
            model=LiteLlm(model="openai/gpt-4o"), # LiteLLM model string format
            name="openai_agent",
            instruction="You are a helpful assistant powered by GPT-4o.",
            # ... other agent parameters
        )

        # --- Example Agent using Anthropic's Claude Haiku (non-Vertex) ---
        # (Requires ANTHROPIC_API_KEY)
        agent_claude_direct = LlmAgent(
            model=LiteLlm(model="anthropic/claude-3-haiku-20240307"),
            name="claude_direct_agent",
            instruction="You are an assistant powered by Claude Haiku.",
            # ... other agent parameters
        )
        ```

!!! warning "Windows Encoding Note for LiteLLM"

    When using ADK agents with LiteLLM on Windows, you might encounter a `UnicodeDecodeError`. This error occurs because LiteLLM may attempt to read cached files using the default Windows encoding (`cp1252`) instead of UTF-8.

    To prevent this, we recommend setting the `PYTHONUTF8` environment variable to `1`. This forces Python to use UTF-8 for all file I/O.

    **Example (PowerShell):**
    ```powershell
    # Set for the current session
    $env:PYTHONUTF8 = "1"

    # Set persistently for the user
    [System.Environment]::SetEnvironmentVariable('PYTHONUTF8', '1', [System.EnvironmentVariableTarget]::User)
    ```


## Using Open & Local Models via LiteLLM

<div class="language-support-tag">
    <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.1.0</span>
</div>

For maximum control, cost savings, privacy, or offline use cases, you can run
open-source models locally or self-host them and integrate them using LiteLLM.

**Integration Method:** Instantiate the `LiteLlm` wrapper class, configured to
point to your local model server.

### Ollama Integration

[Ollama](https://ollama.com/) allows you to easily run open-source models
locally.

#### Model choice

If your agent is relying on tools, please make sure that you select a model with
tool support from [Ollama website](https://ollama.com/search?c=tools).

For reliable results, we recommend using a decent-sized model with tool support.

The tool support for the model can be checked with the following command:

```bash
ollama show mistral-small3.1
  Model
    architecture        mistral3
    parameters          24.0B
    context length      131072
    embedding length    5120
    quantization        Q4_K_M

  Capabilities
    completion
    vision
    tools
```

You are supposed to see `tools` listed under capabilities.

You can also look at the template the model is using and tweak it based on your
needs.

```bash
ollama show --modelfile llama3.2 > model_file_to_modify
```

For instance, the default template for the above model inherently suggests that
the model shall call a function all the time. This may result in an infinite
loop of function calls.

```
Given the following functions, please respond with a JSON for a function call
with its proper arguments that best answers the given prompt.

Respond in the format {"name": function name, "parameters": dictionary of
argument name and its value}. Do not use variables.
```

You can swap such prompts with a more descriptive one to prevent infinite tool
call loops.

For instance:

```
Review the user's prompt and the available functions listed below.
First, determine if calling one of these functions is the most appropriate way to respond. A function call is likely needed if the prompt asks for a specific action, requires external data lookup, or involves calculations handled by the functions. If the prompt is a general question or can be answered directly, a function call is likely NOT needed.

If you determine a function call IS required: Respond ONLY with a JSON object in the format {"name": "function_name", "parameters": {"argument_name": "value"}}. Ensure parameter values are concrete, not variables.

If you determine a function call IS NOT required: Respond directly to the user's prompt in plain text, providing the answer or information requested. Do not output any JSON.
```

Then you can create a new model with the following command:

```bash
ollama create llama3.2-modified -f model_file_to_modify
```

#### Using ollama_chat provider

Our LiteLLM wrapper can be used to create agents with Ollama models.

```py
root_agent = Agent(
    model=LiteLlm(model="ollama_chat/mistral-small3.1"),
    name="dice_agent",
    description=(
        "hello world agent that can roll a dice of 8 sides and check prime"
        " numbers."
    ),
    instruction="""
      You roll dice and answer questions about the outcome of the dice rolls.
    """,
    tools=[
        roll_die,
        check_prime,
    ],
)
```

**It is important to set the provider `ollama_chat` instead of `ollama`. Using
`ollama` will result in unexpected behaviors such as infinite tool call loops
and ignoring previous context.**

While `api_base` can be provided inside LiteLLM for generation, LiteLLM library
is calling other APIs relying on the env variable instead as of v1.65.5 after
completion. So at this time, we recommend setting the env variable
`OLLAMA_API_BASE` to point to the ollama server.

```bash
export OLLAMA_API_BASE="http://localhost:11434"
adk web
```

#### Using openai provider

Alternatively, `openai` can be used as the provider name. But this will also
require setting the `OPENAI_API_BASE=http://localhost:11434/v1` and
`OPENAI_API_KEY=anything` env variables instead of `OLLAMA_API_BASE`. **Please
note that api base now has `/v1` at the end.**

```py
root_agent = Agent(
    model=LiteLlm(model="openai/mistral-small3.1"),
    name="dice_agent",
    description=(
        "hello world agent that can roll a dice of 8 sides and check prime"
        " numbers."
    ),
    instruction="""
      You roll dice and answer questions about the outcome of the dice rolls.
    """,
    tools=[
        roll_die,
        check_prime,
    ],
)
```

```bash
export OPENAI_API_BASE=http://localhost:11434/v1
export OPENAI_API_KEY=anything
adk web
```

#### Debugging

You can see the request sent to the Ollama server by adding the following in
your agent code just after imports.

```py
import litellm
litellm._turn_on_debug()
```

Look for a line like the following:

```bash
Request Sent from LiteLLM:
curl -X POST \
http://localhost:11434/api/chat \
-d '{'model': 'mistral-small3.1', 'messages': [{'role': 'system', 'content': ...
```

### Self-Hosted Endpoint (e.g., vLLM)

<div class="language-support-tag">
   <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python</span>
</div>

Tools such as [vLLM](https://github.com/vllm-project/vllm) allow you to host
models efficiently and often expose an OpenAI-compatible API endpoint.

**Setup:**

1. **Deploy Model:** Deploy your chosen model using vLLM (or a similar tool).
   Note the API base URL (e.g., `https://your-vllm-endpoint.run.app/v1`).
    * *Important for ADK Tools:* When deploying, ensure the serving tool
      supports and enables OpenAI-compatible tool/function calling. For vLLM,
      this might involve flags like `--enable-auto-tool-choice` and potentially
      a specific `--tool-call-parser`, depending on the model. Refer to the vLLM
      documentation on Tool Use.
2. **Authentication:** Determine how your endpoint handles authentication (e.g.,
   API key, bearer token).

    **Integration Example:**

    ```python
    import subprocess
    from google.adk.agents import LlmAgent
    from google.adk.models.lite_llm import LiteLlm

    # --- Example Agent using a model hosted on a vLLM endpoint ---

    # Endpoint URL provided by your vLLM deployment
    api_base_url = "https://your-vllm-endpoint.run.app/v1"

    # Model name as recognized by *your* vLLM endpoint configuration
    model_name_at_endpoint = "hosted_vllm/google/gemma-3-4b-it" # Example from vllm_test.py

    # Authentication (Example: using gcloud identity token for a Cloud Run deployment)
    # Adapt this based on your endpoint's security
    try:
        gcloud_token = subprocess.check_output(
            ["gcloud", "auth", "print-identity-token", "-q"]
        ).decode().strip()
        auth_headers = {"Authorization": f"Bearer {gcloud_token}"}
    except Exception as e:
        print(f"Warning: Could not get gcloud token - {e}. Endpoint might be unsecured or require different auth.")
        auth_headers = None # Or handle error appropriately

    agent_vllm = LlmAgent(
        model=LiteLlm(
            model=model_name_at_endpoint,
            api_base=api_base_url,
            # Pass authentication headers if needed
            extra_headers=auth_headers
            # Alternatively, if endpoint uses an API key:
            # api_key="YOUR_ENDPOINT_API_KEY"
        ),
        name="vllm_agent",
        instruction="You are a helpful assistant running on a self-hosted vLLM endpoint.",
        # ... other agent parameters
    )
    ```

## Using Hosted & Tuned Models on Vertex AI

For enterprise-grade scalability, reliability, and integration with Google
Cloud's MLOps ecosystem, you can use models deployed to Vertex AI Endpoints.
This includes models from Model Garden or your own fine-tuned models.

**Integration Method:** Pass the full Vertex AI Endpoint resource string
(`projects/PROJECT_ID/locations/LOCATION/endpoints/ENDPOINT_ID`) directly to the
`model` parameter of `LlmAgent`.

**Vertex AI Setup (Consolidated):**

Ensure your environment is configured for Vertex AI:

1. **Authentication:** Use Application Default Credentials (ADC):

    ```shell
    gcloud auth application-default login
    ```

2. **Environment Variables:** Set your project and location:

    ```shell
    export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
    export GOOGLE_CLOUD_LOCATION="YOUR_VERTEX_AI_LOCATION" # e.g., us-central1
    ```

3. **Enable Vertex Backend:** Crucially, ensure the `google-genai` library
   targets Vertex AI:

    ```shell
    export GOOGLE_GENAI_USE_VERTEXAI=TRUE
    ```

### Model Garden Deployments

<div class="language-support-tag">
    <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.2.0</span>
</div>

You can deploy various open and proprietary models from the
[Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
to an endpoint.

**Example:**

```python
from google.adk.agents import LlmAgent
from google.genai import types # For config objects

# --- Example Agent using a Llama 3 model deployed from Model Garden ---

# Replace with your actual Vertex AI Endpoint resource name
llama3_endpoint = "projects/YOUR_PROJECT_ID/locations/us-central1/endpoints/YOUR_LLAMA3_ENDPOINT_ID"

agent_llama3_vertex = LlmAgent(
    model=llama3_endpoint,
    name="llama3_vertex_agent",
    instruction="You are a helpful assistant based on Llama 3, hosted on Vertex AI.",
    generate_content_config=types.GenerateContentConfig(max_output_tokens=2048),
    # ... other agent parameters
)
```

### Fine-tuned Model Endpoints

<div class="language-support-tag">
    <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.2.0</span>
</div>

Deploying your fine-tuned models (whether based on Gemini or other architectures
supported by Vertex AI) results in an endpoint that can be used directly.

**Example:**

```python
from google.adk.agents import LlmAgent

# --- Example Agent using a fine-tuned Gemini model endpoint ---

# Replace with your fine-tuned model's endpoint resource name
finetuned_gemini_endpoint = "projects/YOUR_PROJECT_ID/locations/us-central1/endpoints/YOUR_FINETUNED_ENDPOINT_ID"

agent_finetuned_gemini = LlmAgent(
    model=finetuned_gemini_endpoint,
    name="finetuned_gemini_agent",
    instruction="You are a specialized assistant trained on specific data.",
    # ... other agent parameters
)
```

### Third-Party Models on Vertex AI (e.g., Anthropic Claude)

Some providers, like Anthropic, make their models available directly through
Vertex AI.

=== "Python"

    **Integration Method:** Uses the direct model string (e.g.,
    `"claude-3-sonnet@20240229"`), *but requires manual registration* within ADK.

    **Why Registration?** ADK's registry automatically recognizes `gemini-*` strings
    and standard Vertex AI endpoint strings (`projects/.../endpoints/...`) and
    routes them via the `google-genai` library. For other model types used directly
    via Vertex AI (like Claude), you must explicitly tell the ADK registry which
    specific wrapper class (`Claude` in this case) knows how to handle that model
    identifier string with the Vertex AI backend.

    **Setup:**

    1. **Vertex AI Environment:** Ensure the consolidated Vertex AI setup (ADC, Env
       Vars, `GOOGLE_GENAI_USE_VERTEXAI=TRUE`) is complete.

    2. **Install Provider Library:** Install the necessary client library configured
       for Vertex AI.

        ```shell
        pip install "anthropic[vertex]"
        ```

    3. **Register Model Class:** Add this code near the start of your application,
       *before* creating an agent using the Claude model string:

        ```python
        # Required for using Claude model strings directly via Vertex AI with LlmAgent
        from google.adk.models.anthropic_llm import Claude
        from google.adk.models.registry import LLMRegistry

        LLMRegistry.register(Claude)
        ```

       **Example:**

       ```python
       from google.adk.agents import LlmAgent
       from google.adk.models.anthropic_llm import Claude # Import needed for registration
       from google.adk.models.registry import LLMRegistry # Import needed for registration
       from google.genai import types

       # --- Register Claude class (do this once at startup) ---
       LLMRegistry.register(Claude)

       # --- Example Agent using Claude 3 Sonnet on Vertex AI ---

       # Standard model name for Claude 3 Sonnet on Vertex AI
       claude_model_vertexai = "claude-3-sonnet@20240229"

       agent_claude_vertexai = LlmAgent(
           model=claude_model_vertexai, # Pass the direct string after registration
           name="claude_vertexai_agent",
           instruction="You are an assistant powered by Claude 3 Sonnet on Vertex AI.",
           generate_content_config=types.GenerateContentConfig(max_output_tokens=4096),
           # ... other agent parameters
       )
       ```

=== "Java"

    **Integration Method:** Directly instantiate the provider-specific model class (e.g., `com.google.adk.models.Claude`) and configure it with a Vertex AI backend.

    **Why Direct Instantiation?** The Java ADK's `LlmRegistry` primarily handles Gemini models by default. For third-party models like Claude on Vertex AI, you directly provide an instance of the ADK's wrapper class (e.g., `Claude`) to the `LlmAgent`. This wrapper class is responsible for interacting with the model via its specific client library, configured for Vertex AI.

    **Setup:**

    1.  **Vertex AI Environment:**
        *   Ensure your Google Cloud project and region are correctly set up.
        *   **Application Default Credentials (ADC):** Make sure ADC is configured correctly in your environment. This is typically done by running `gcloud auth application-default login`. The Java client libraries will use these credentials to authenticate with Vertex AI. Follow the [Google Cloud Java documentation on ADC](https://cloud.google.com/java/docs/reference/google-auth-library/latest/com.google.auth.oauth2.GoogleCredentials#com_google_auth_oauth2_GoogleCredentials_getApplicationDefault__) for detailed setup.

    2.  **Provider Library Dependencies:**
        *   **Third-Party Client Libraries (Often Transitive):** The ADK core library often includes the necessary client libraries for common third-party models on Vertex AI (like Anthropic's required classes) as **transitive dependencies**. This means you might not need to explicitly add a separate dependency for the Anthropic Vertex SDK in your `pom.xml` or `build.gradle`.

    3.  **Instantiate and Configure the Model:**
        When creating your `LlmAgent`, instantiate the `Claude` class (or the equivalent for another provider) and configure its `VertexBackend`.

    **Example:**

    ```java
    import com.anthropic.client.AnthropicClient;
    import com.anthropic.client.okhttp.AnthropicOkHttpClient;
    import com.anthropic.vertex.backends.VertexBackend;
    import com.google.adk.agents.LlmAgent;
    import com.google.adk.models.Claude; // ADK's wrapper for Claude
    import com.google.auth.oauth2.GoogleCredentials;
    import java.io.IOException;

    // ... other imports

    public class ClaudeVertexAiAgent {

        public static LlmAgent createAgent() throws IOException {
            // Model name for Claude 3 Sonnet on Vertex AI (or other versions)
            String claudeModelVertexAi = "claude-3-7-sonnet"; // Or any other Claude model

            // Configure the AnthropicOkHttpClient with the VertexBackend
            AnthropicClient anthropicClient = AnthropicOkHttpClient.builder()
                .backend(
                    VertexBackend.builder()
                        .region("us-east5") // Specify your Vertex AI region
                        .project("your-gcp-project-id") // Specify your GCP Project ID
                        .googleCredentials(GoogleCredentials.getApplicationDefault())
                        .build())
                .build();

            // Instantiate LlmAgent with the ADK Claude wrapper
            LlmAgent agentClaudeVertexAi = LlmAgent.builder()
                .model(new Claude(claudeModelVertexAi, anthropicClient)) // Pass the Claude instance
                .name("claude_vertexai_agent")
                .instruction("You are an assistant powered by Claude 3 Sonnet on Vertex AI.")
                // .generateContentConfig(...) // Optional: Add generation config if needed
                // ... other agent parameters
                .build();

            return agentClaudeVertexAi;
        }

        public static void main(String[] args) {
            try {
                LlmAgent agent = createAgent();
                System.out.println("Successfully created agent: " + agent.name());
                // Here you would typically set up a Runner and Session to interact with the agent
            } catch (IOException e) {
                System.err.println("Failed to create agent: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
    ```# Computer Use Toolset with Gemini API

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v1.17.0</span><span class="lst-preview">Preview</span>
</div>

The Computer Use Toolset allows an agent to operate a user interface
of a computer, such as browsers, to complete tasks. This tool uses
a specific Gemini model and the [Playwright](https://playwright.dev/)
testing tool to control a Chromium browser and can interact with
web pages by taking screenshots, clicking, typing, and navigating.

For more information about the computer use model, see
Gemini API [Computer use](https://ai.google.dev/gemini-api/docs/computer-use)
or the Google Cloud Vertex AI API
[Computer use](https://cloud.google.com/vertex-ai/generative-ai/docs/computer-use).

!!! example "Preview release"
    The Computer Use model and tool is a Preview release. For
    more information, see the
    [launch stage descriptions](https://cloud.google.com/products#product-launch-stages).

## Setup

You must install Playwright and its dependencies, including Chromium,
to be able to use the Computer Use Toolset.

??? tip "Recommended: create and activate a Python virtual environment"

    Create a Python virtual environment:

    ```shell
    python -m venv .venv
    ```

    Activate the Python virtual environment:

    === "Windows CMD"

        ```console
        .venv\Scripts\activate.bat
        ```

    === "Windows Powershell"

        ```console
        .venv\Scripts\Activate.ps1
        ```

    === "MacOS / Linux"

        ```bash
        source .venv/bin/activate
        ```

To set up the required software libraries for the Computer Use Toolset:

1.  Install Python dependencies:
    ```console
    pip install termcolor==3.1.0
    pip install playwright==1.52.0
    pip install browserbase==1.3.0
    pip install rich
    ```
2.  Install the Playwright dependencies, including the Chromium browser:
    ```console
    playwright install-deps chromium
    playwright install chromium
    ```

## Use the tool

Use the Computer Use Toolset by adding it as a tool to your agent. When you
configure the tool, you must provide a implementation of the `BaseComputer`
class which defines an interface for an agent to use a computer. In the
following example, the `PlaywrightComputer` class is defined for this purpose.
You can find the code for this implementation in `playwright.py` file of the
[computer_use](https://github.com/google/adk-python/blob/main/contributing/samples/computer_use/playwright.py)
agent sample project.

```python
from google.adk import Agent
from google.adk.models.google_llm import Gemini
from google.adk.tools.computer_use.computer_use_toolset import ComputerUseToolset
from typing_extensions import override

from .playwright import PlaywrightComputer

root_agent = Agent(
    model='gemini-2.5-computer-use-preview-10-2025',
    name='hello_world_agent',
    description=(
        'computer use agent that can operate a browser on a computer to finish'
        ' user tasks'
    ),
    instruction='you are a computer use agent',
    tools=[
        ComputerUseToolset(computer=PlaywrightComputer(screen_size=(1280, 936)))
    ],
)
```

For a complete code example, see the
[computer_use](https://github.com/google/adk-python/tree/main/contributing/samples/computer_use)
agent sample project.
# GitHub

The [GitHub MCP Server](https://github.com/github/github-mcp-server) connects AI
tools directly to GitHub's platform. This gives your ADK agent the ability to
read repositories and code files, manage issues and PRs, analyze code, and
automate workflows using natural language.

## Use cases

- **Repository Management**: Browse and query code, search files, analyze
  commits, and understand project structure across any repository you have
  access to.
- **Issue & PR Automation**: Create, update, and manage issues and pull
  requests. Let AI help triage bugs, review code changes, and maintain project
  boards.
- **Code Analysis**: Examine security findings, review Dependabot alerts,
  understand code patterns, and get comprehensive insights into your codebase.

## Prerequisites

- Create a
  [Personal Access Token](https://github.com/settings/personal-access-tokens/new) in GitHub. Refer to the [documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for more information.

## Use with agent

=== "Remote MCP Server"

    ```python
    from google.adk.agents import Agent
    from google.adk.tools.mcp_tool import McpToolset
    from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPServerParams

    GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"

    root_agent = Agent(
        model="gemini-2.5-pro",
        name="github_agent",
        instruction="Help users get information from GitHub",
        tools=[
            McpToolset(
                connection_params=StreamableHTTPServerParams(
                    url="https://api.githubcopilot.com/mcp/",
                    headers={
                        "Authorization": f"Bearer {GITHUB_TOKEN}",
                        "X-MCP-Toolsets": "all",
                        "X-MCP-Readonly": "true"
                    },
                ),
            )
        ],
    )
    ```

## Available tools

Tool | Description
---- | -----------
`context` | Tools that provide context about the current user and GitHub context you are operating in
`copilot` | Copilot related tools (e.g. Copilot Coding Agent)
`copilot_spaces` | Copilot Spaces related tools
`actions` | GitHub Actions workflows and CI/CD operations
`code_security` | Code security related tools, such as GitHub Code Scanning
`dependabot` | Dependabot tools
`discussions` | GitHub Discussions related tools
`experiments` | Experimental features that are not considered stable yet
`gists` | GitHub Gist related tools
`github_support_docs_search` | Search docs to answer GitHub product and support questions
`issues` | GitHub Issues related tools
`labels` | GitHub Labels related tools
`notifications` | GitHub Notifications related tools
`orgs` | GitHub Organization related tools
`projects` | GitHub Projects related tools
`pull_requests` | GitHub Pull Request related tools
`repos` | GitHub Repository related tools
`secret_protection` | Secret protection related tools, such as GitHub Secret Scanning
`security_advisories` | Security advisories related tools
`stargazers` | GitHub Stargazers related tools
`users` | GitHub User related tools

## Configuration

The Remote GitHub MCP server has optional headers that can be used to configure
available toolsets and read-only mode:

- `X-MCP-Toolsets`: Comma-separated list of toolsets to enable. (e.g., "repos,issues")
    - If the list is empty, default toolsets will be used. If a bad toolset is
      provided, the server will fail to start and emit a 400 bad request status.
      Whitespace is ignored.

- `X-MCP-Readonly`: Enables only "read" tools.
    - If this header is empty, "false", "f", "no", "n", "0", or "off" (ignoring
      whitespace and case), it will be interpreted as false. All other values
      are interpreted as true.


## Additional resources

- [GitHub MCP Server Repository](https://github.com/github/github-mcp-server)
- [Remote GitHub MCP Server Documentation](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md)
- [Policies and Governance for the GitHub MCP Server](https://github.com/github/github-mcp-server/blob/main/docs/policies-and-governance.md)

# Hugging Face

The [Hugging Face MCP Server](https://github.com/huggingface/hf-mcp-server) can be used to connect
your ADK agent to the Hugging Face Hub and thousands of Gradio AI Applications.

## Use cases

- **Discover AI/ML Assets**: Search and filter the Hub for models, datasets, and
  papers based on tasks, libraries, or keywords.
- **Build Multi-Step Workflows**: Chain tools together, such as transcribing
  audio with one tool and then summarizing the resulting text with another.
- **Find AI Applications**: Search for Gradio Spaces that can perform a specific
  task, like background removal or text-to-speech.

## Prerequisites

- Create a [user access token](https://huggingface.co/settings/tokens) in
  Hugging Face. Refer to the
  [documentation](https://huggingface.co/docs/hub/en/security-tokens) for more
  information.

## Use with agent

=== "Local MCP Server"

    ```python
    from google.adk.agents import Agent
    from google.adk.tools.mcp_tool import McpToolset
    from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
    from mcp import StdioServerParameters

    HUGGING_FACE_TOKEN = "YOUR_HUGGING_FACE_TOKEN"

    root_agent = Agent(
        model="gemini-2.5-pro",
        name="hugging_face_agent",
        instruction="Help users get information from Hugging Face",
        tools=[
            McpToolset(
                connection_params=StdioConnectionParams(
                    server_params = StdioServerParameters(
                        command="npx",
                        args=[
                            "-y",
                            "@llmindset/hf-mcp-server",
                        ],
                        env={
                            "HF_TOKEN": HUGGING_FACE_TOKEN,
                        }
                    ),
                    timeout=30,
                ),
            )
        ],
    )
    ```

=== "Remote MCP Server"

    ```python
    from google.adk.agents import Agent
    from google.adk.tools.mcp_tool import McpToolset
    from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPServerParams

    HUGGING_FACE_TOKEN = "YOUR_HUGGING_FACE_TOKEN"

    root_agent = Agent(
        model="gemini-2.5-pro",
        name="hugging_face_agent",
        instruction="Help users get information from Hugging Face",
        tools=[
            McpToolset(
                connection_params=StreamableHTTPServerParams(
                    url="https://huggingface.co/mcp",
                    headers={
                        "Authorization": f"Bearer {HUGGING_FACE_TOKEN}",
                    },
                ),
            )
        ],
    )
    ```

## Available tools

Tool | Description
---- | -----------
Spaces Semantic Search | Find the best AI Apps via natural language queries
Papers Semantic Search | Find ML Research Papers via natural language queries
Model Search | Search for ML models with filters for task, library, etc…
Dataset Search | Search for datasets with filters for author, tags, etc…
Documentation Semantic Search | Search the Hugging Face documentation library
Hub Repository Details | Get detailed information about Models, Datasets and Spaces

## Configuration

To configure which tools are available in your Hugging Face Hub MCP server,
visit the [MCP Settings Page](https://huggingface.co/settings/mcp) in your
Hugging Face account.


To configure the local MCP server, you can use the following environment
variables:

- `TRANSPORT`: The transport type to use (`stdio`, `sse`, `streamableHttp`, or
  `streamableHttpJson`)
- `DEFAULT_HF_TOKEN`: ⚠️ Requests are serviced with the `HF_TOKEN` received in
  the Authorization: Bearer header. The DEFAULT_HF_TOKEN is used if no header
  was sent. Only set this in Development / Test environments or for local STDIO
  Deployments. ⚠️
- If running with stdio transport, `HF_TOKEN` is used if `DEFAULT_HF_TOKEN` is
  not set.
- `HF_API_TIMEOUT`: Timeout for Hugging Face API requests in milliseconds
  (default: 12500ms / 12.5 seconds)
- `USER_CONFIG_API`: URL to use for User settings (defaults to Local front-end)
- `MCP_STRICT_COMPLIANCE`: set to True for GET 405 rejects in JSON Mode (default
  serves a welcome page).
- `AUTHENTICATE_TOOL`: whether to include an Authenticate tool to issue an OAuth
  challenge when called
- `SEARCH_ENABLES_FETCH`: When set to true, automatically enables the
  hf_doc_fetch tool whenever hf_doc_search is enabled


## Additional resources

- [Hugging Face MCP Server Repository](https://github.com/huggingface/hf-mcp-server)
- [Hugging Face MCP Server Documentation](https://huggingface.co/docs/hub/en/hf-mcp-server)

# Build chat experiences with AG-UI and CopilotKit

As an agent builder, you want users to interact with your agents through a rich
and responsive interface. Building UIs from scratch requires a lot of effort,
especially to support streaming events and client state. That's exactly what
[AG-UI](https://docs.ag-ui.com/) was designed for - rich user experiences
directly connected to an agent.

[AG-UI](https://github.com/ag-ui-protocol/ag-ui) provides a consistent interface
to empower rich clients across technology stacks, from mobile to the web and
even the command line. There are a number of different clients that support
AG-UI:

- [CopilotKit](https://copilotkit.ai) provides tooling and components to tightly integrate your agent with web applications
- Clients for [Kotlin](https://github.com/ag-ui-protocol/ag-ui/tree/main/sdks/community/kotlin), [Java](https://github.com/ag-ui-protocol/ag-ui/tree/main/sdks/community/java), [Go](https://github.com/ag-ui-protocol/ag-ui/tree/main/sdks/community/go/example/client), and [CLI implementations](https://github.com/ag-ui-protocol/ag-ui/tree/main/apps/client-cli-example/src) in TypeScript

This tutorial uses CopilotKit to create a sample app backed by an ADK agent that
demonstrates some of the features supported by AG-UI.

## Quickstart

To get started, let's create a sample application with an ADK agent and a simple
web client:

```
npx create-ag-ui-app@latest --adk
```

### Chat

Chat is a familiar interface for exposing your agent, and AG-UI handles
streaming messages between your users and agents:

```tsx title="src/app/page.tsx"
<CopilotSidebar
  clickOutsideToClose={false}
  defaultOpen={true}
  labels={{
    title: "Popup Assistant",
    initial: "👋 Hi, there! You're chatting with an agent. This agent comes with a few tools to get you started..."
  }}
/>
```

Learn more about the chat UI
[in the CopilotKit docs](https://docs.copilotkit.ai/adk/agentic-chat-ui).

### Tool Based Generative UI (Rendering Tools)

AG-UI lets you share tool information with a Generative UI so that it can be
displayed to users:

```tsx title="src/app/page.tsx"
useCopilotAction({
  name: "get_weather",
  description: "Get the weather for a given location.",
  available: "disabled",
  parameters: [
    { name: "location", type: "string", required: true },
  ],
  render: ({ args }) => {
    return <WeatherCard location={args.location} themeColor={themeColor} />
  },
});
```

Learn more about the Tool-based Generative UI
[in the CopilotKit docs](https://docs.copilotkit.ai/adk/generative-ui/tool-based).

### Shared State

ADK agents can be stateful, and synchronizing that state between your agents and
your UIs enables powerful and fluid user experiences. State can be synchronized
both ways so agents are automatically aware of changes made by your user or
other parts of your application:

```tsx title="src/app/page.tsx"
const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: {
    proverbs: [
      "CopilotKit may be new, but its the best thing since sliced bread.",
    ],
  },
})
```

Learn more about shared state
[in the CopilotKit docs](https://docs.copilotkit.ai/adk/shared-state).

### Try it out!

```
npm install && npm run dev
```

## Resources

To see what other features you can build into your UI with AG-UI, refer to the CopilotKit docs:

- [Agentic Generative UI](https://docs.copilotkit.ai/adk/generative-ui/agentic)
- [Human in the Loop](https://docs.copilotkit.ai/adk/human-in-the-loop/agent)
- [Frontend Actions](https://docs.copilotkit.ai/adk/frontend-actions)

Or try them out in the [AG-UI Dojo](https://dojo.ag-ui.com).

# Memory: Long-Term Knowledge with `MemoryService`

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python v0.1.0</span><span class="lst-typescript">Typescript v0.2.0</span><span class="lst-go">Go v0.1.0</span><span class="lst-java">Java v0.1.0</span>
</div>

We've seen how `Session` tracks the history (`events`) and temporary data (`state`) for a *single, ongoing conversation*. But what if an agent needs to recall information from *past* conversations? This is where the concept of **Long-Term Knowledge** and the **`MemoryService`** come into play.

Think of it this way:

* **`Session` / `State`:** Like your short-term memory during one specific chat.
* **Long-Term Knowledge (`MemoryService`)**: Like a searchable archive or knowledge library the agent can consult, potentially containing information from many past chats or other sources.

## The `MemoryService` Role

The `BaseMemoryService` defines the interface for managing this searchable, long-term knowledge store. Its primary responsibilities are:

1. **Ingesting Information (`add_session_to_memory`):** Taking the contents of a (usually completed) `Session` and adding relevant information to the long-term knowledge store.
2. **Searching Information (`search_memory`):** Allowing an agent (typically via a `Tool`) to query the knowledge store and retrieve relevant snippets or context based on a search query.

## Choosing the Right Memory Service

The ADK offers two distinct `MemoryService` implementations, each tailored to different use cases. Use the table below to decide which is the best fit for your agent.

| **Feature** | **InMemoryMemoryService** | **VertexAiMemoryBankService** |
| :--- | :--- | :--- |
| **Persistence** | None (data is lost on restart) | Yes (Managed by Vertex AI) |
| **Primary Use Case** | Prototyping, local development, and simple testing. | Building meaningful, evolving memories from user conversations. |
| **Memory Extraction** | Stores full conversation | Extracts [meaningful information](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/memory-bank/generate-memories) from conversations and consolidates it with existing memories (powered by LLM) |
| **Search Capability** | Basic keyword matching. | Advanced semantic search. |
| **Setup Complexity** | None. It's the default. | Low. Requires an [Agent Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/memory-bank/overview) instance in Vertex AI. |
| **Dependencies** | None. | Google Cloud Project, Vertex AI API |
| **When to use it** | When you want to search across multiple sessions’ chat histories for prototyping. | When you want your agent to remember and learn from past interactions. |

## In-Memory Memory

The `InMemoryMemoryService` stores session information in the application's memory and performs basic keyword matching for searches. It requires no setup and is best for prototyping and simple testing scenarios where persistence isn't required.

=== "Python"

    ```py
    from google.adk.memory import InMemoryMemoryService
    memory_service = InMemoryMemoryService()
    ```

=== "Go"
    ```go
    import (
      "google.golang.org/adk/memory"
      "google.golang.org/adk/session"
    )

    // Services must be shared across runners to share state and memory.
    sessionService := session.InMemoryService()
    memoryService := memory.InMemoryService()
    ```


**Example: Adding and Searching Memory**

This example demonstrates the basic flow using the `InMemoryMemoryService` for simplicity.

=== "Python"

    ```py
    import asyncio
    from google.adk.agents import LlmAgent
    from google.adk.sessions import InMemorySessionService, Session
    from google.adk.memory import InMemoryMemoryService # Import MemoryService
    from google.adk.runners import Runner
    from google.adk.tools import load_memory # Tool to query memory
    from google.genai.types import Content, Part

    # --- Constants ---
    APP_NAME = "memory_example_app"
    USER_ID = "mem_user"
    MODEL = "gemini-2.0-flash" # Use a valid model

    # --- Agent Definitions ---
    # Agent 1: Simple agent to capture information
    info_capture_agent = LlmAgent(
        model=MODEL,
        name="InfoCaptureAgent",
        instruction="Acknowledge the user's statement.",
    )

    # Agent 2: Agent that can use memory
    memory_recall_agent = LlmAgent(
        model=MODEL,
        name="MemoryRecallAgent",
        instruction="Answer the user's question. Use the 'load_memory' tool "
                    "if the answer might be in past conversations.",
        tools=[load_memory] # Give the agent the tool
    )

    # --- Services ---
    # Services must be shared across runners to share state and memory
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService() # Use in-memory for demo

    async def run_scenario():
        # --- Scenario ---

        # Turn 1: Capture some information in a session
        print("--- Turn 1: Capturing Information ---")
        runner1 = Runner(
            # Start with the info capture agent
            agent=info_capture_agent,
            app_name=APP_NAME,
            session_service=session_service,
            memory_service=memory_service # Provide the memory service to the Runner
        )
        session1_id = "session_info"
        await runner1.session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=session1_id)
        user_input1 = Content(parts=[Part(text="My favorite project is Project Alpha.")], role="user")

        # Run the agent
        final_response_text = "(No final response)"
        async for event in runner1.run_async(user_id=USER_ID, session_id=session1_id, new_message=user_input1):
            if event.is_final_response() and event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
        print(f"Agent 1 Response: {final_response_text}")

        # Get the completed session
        completed_session1 = await runner1.session_service.get_session(app_name=APP_NAME, user_id=USER_ID, session_id=session1_id)

        # Add this session's content to the Memory Service
        print("\n--- Adding Session 1 to Memory ---")
        await memory_service.add_session_to_memory(completed_session1)
        print("Session added to memory.")

        # Turn 2: Recall the information in a new session
        print("\n--- Turn 2: Recalling Information ---")
        runner2 = Runner(
            # Use the second agent, which has the memory tool
            agent=memory_recall_agent,
            app_name=APP_NAME,
            session_service=session_service, # Reuse the same service
            memory_service=memory_service   # Reuse the same service
        )
        session2_id = "session_recall"
        await runner2.session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=session2_id)
        user_input2 = Content(parts=[Part(text="What is my favorite project?")], role="user")

        # Run the second agent
        final_response_text_2 = "(No final response)"
        async for event in runner2.run_async(user_id=USER_ID, session_id=session2_id, new_message=user_input2):
            if event.is_final_response() and event.content and event.content.parts:
                final_response_text_2 = event.content.parts[0].text
        print(f"Agent 2 Response: {final_response_text_2}")

    # To run this example, you can use the following snippet:
    # asyncio.run(run_scenario())

    # await run_scenario()
    ```

=== "Go"

    ```go
    --8<-- "examples/go/snippets/sessions/memory_example/memory_example.go:full_example"
    ```


### Searching Memory Within a Tool

You can also search memory from within a custom tool by using the `tool.Context`.

=== "Go"

    ```go
    --8<-- "examples/go/snippets/sessions/memory_example/memory_example.go:tool_search"
    ```

## Vertex AI Memory Bank

The `VertexAiMemoryBankService` connects your agent to [Vertex AI Memory Bank](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/memory-bank/overview), a fully managed Google Cloud service that provides sophisticated, persistent memory capabilities for conversational agents.

### How It Works

The service handles two key operations:

*   **Generating Memories:** At the end of a conversation, you can send the session's events to the Memory Bank, which intelligently processes and stores the information as "memories."
*   **Retrieving Memories:** Your agent code can issue a search query against the Memory Bank to retrieve relevant memories from past conversations.

### Prerequisites

Before you can use this feature, you must have:

1.  **A Google Cloud Project:** With the Vertex AI API enabled.
2.  **An Agent Engine:** You need to create an Agent Engine in Vertex AI. You do not need to deploy your agent to Agent Engine Runtime to use Memory Bank. This will provide you with the **Agent Engine ID** required for configuration.
3.  **Authentication:** Ensure your local environment is authenticated to access Google Cloud services. The simplest way is to run:
    ```bash
    gcloud auth application-default login
    ```
4.  **Environment Variables:** The service requires your Google Cloud Project ID and Location. Set them as environment variables:
    ```bash
    export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
    export GOOGLE_CLOUD_LOCATION="your-gcp-location"
    ```

### Configuration

To connect your agent to the Memory Bank, you use the `--memory_service_uri` flag when starting the ADK server (`adk web` or `adk api_server`). The URI must be in the format `agentengine://<agent_engine_id>`.

```bash title="bash"
adk web path/to/your/agents_dir --memory_service_uri="agentengine://1234567890"
```

Or, you can configure your agent to use the Memory Bank by manually instantiating the `VertexAiMemoryBankService` and passing it to the `Runner`.

=== "Python"
  ```py
  from google.adk.memory import VertexAiMemoryBankService

  agent_engine_id = agent_engine.api_resource.name.split("/")[-1]

  memory_service = VertexAiMemoryBankService(
      project="PROJECT_ID",
      location="LOCATION",
      agent_engine_id=agent_engine_id
  )

  runner = adk.Runner(
      ...
      memory_service=memory_service
  )
  ```

## Using Memory in Your Agent

When a memory service is configured, your agent can use a tool or callback to retrieve memories. ADK includes two pre-built tools for retrieving memories:

* `PreloadMemory`: Always retrieve memory at the beginning of each turn (similar to a callback).
* `LoadMemory`: Retrieve memory when your agent decides it would be helpful.

**Example:**

=== "Python"
```python
from google.adk.agents import Agent
from google.adk.tools.preload_memory_tool import PreloadMemoryTool

agent = Agent(
    model=MODEL_ID,
    name='weather_sentiment_agent',
    instruction="...",
    tools=[PreloadMemoryTool()]
)
```

To extract memories from your session, you need to call `add_session_to_memory`. For example, you can automate this via a callback:

=== "Python"
```python
from google import adk

async def auto_save_session_to_memory_callback(callback_context):
    await callback_context._invocation_context.memory_service.add_session_to_memory(
        callback_context._invocation_context.session)

agent = Agent(
    model=MODEL,
    name="Generic_QA_Agent",
    instruction="Answer the user's questions",
    tools=[adk.tools.preload_memory_tool.PreloadMemoryTool()],
    after_agent_callback=auto_save_session_to_memory_callback,
)
```

## Advanced Concepts

### How Memory Works in Practice

The memory workflow internally involves these steps:

1. **Session Interaction:** A user interacts with an agent via a `Session`, managed by a `SessionService`. Events are added, and state might be updated.
2. **Ingestion into Memory:** At some point (often when a session is considered complete or has yielded significant information), your application calls `memory_service.add_session_to_memory(session)`. This extracts relevant information from the session's events and adds it to the long-term knowledge store (in-memory dictionary or Agent Engine Memory Bank).
3. **Later Query:** In a *different* (or the same) session, the user might ask a question requiring past context (e.g., "What did we discuss about project X last week?").
4. **Agent Uses Memory Tool:** An agent equipped with a memory-retrieval tool (like the built-in `load_memory` tool) recognizes the need for past context. It calls the tool, providing a search query (e.g., "discussion project X last week").
5. **Search Execution:** The tool internally calls `memory_service.search_memory(app_name, user_id, query)`.
6. **Results Returned:** The `MemoryService` searches its store (using keyword matching or semantic search) and returns relevant snippets as a `SearchMemoryResponse` containing a list of `MemoryResult` objects (each potentially holding events from a relevant past session).
7. **Agent Uses Results:** The tool returns these results to the agent, usually as part of the context or function response. The agent can then use this retrieved information to formulate its final answer to the user.

### Can an agent have access to more than one memory service?

*   **Through Standard Configuration: No.** The framework (`adk web`, `adk api_server`) is designed to be configured with one single memory service at a time via the `--memory_service_uri` flag. This single service is then provided to the agent and accessed through the built-in `self.search_memory()` method. From a configuration standpoint, you can only choose one backend (`InMemory`, `VertexAiMemoryBankService`) for all agents served by that process.

*   **Within Your Agent's Code: Yes, absolutely.** There is nothing preventing you from manually importing and instantiating another memory service directly inside your agent's code. This allows you to access multiple memory sources within a single agent turn.

For example, your agent could use the framework-configured `InMemoryMemoryService` to recall conversational history, and also manually instantiate a `VertexAiMemoryBankService` to look up information in a technical manual.

#### Example: Using Two Memory Services

Here’s how you could implement that in your agent's code:

=== "Python"
```python
from google.adk.agents import Agent
from google.adk.memory import InMemoryMemoryService, VertexAiMemoryBankService
from google.genai import types

class MultiMemoryAgent(Agent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.memory_service = InMemoryMemoryService()
        # Manually instantiate a second memory service for document lookups
        self.vertexai_memorybank_service = VertexAiMemoryBankService(
            project="PROJECT_ID",
            location="LOCATION",
            agent_engine_id="AGENT_ENGINE_ID"
        )

    async def run(self, request: types.Content, **kwargs) -> types.Content:
        user_query = request.parts[0].text

        # 1. Search conversational history using the framework-provided memory
        #    (This would be InMemoryMemoryService if configured)
        conversation_context = await self.memory_service.search_memory(query=user_query)

        # 2. Search the document knowledge base using the manually created service
        document_context = await self.vertexai_memorybank_service.search_memory(query=user_query)

        # Combine the context from both sources to generate a better response
        prompt = "From our past conversations, I remember:\n"
        prompt += f"{conversation_context.memories}\n\n"
        prompt += "From the technical manuals, I found:\n"
        prompt += f"{document_context.memories}\n\n"
        prompt += f"Based on all this, here is my answer to '{user_query}':"

        return await self.llm.generate_content_async(prompt)
```# Model Context Protocol (MCP)

<div class="language-support-tag">
  <span class="lst-supported">Supported in ADK</span><span class="lst-python">Python</span><span class="lst-typescript">TypeScript</span><span class="lst-go">Go</span><span class="lst-java">Java</span>
</div>

The
[Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is
an open standard designed to standardize how Large Language Models (LLMs) like
Gemini and Claude communicate with external applications, data sources, and
tools. Think of it as a universal connection mechanism that simplifies how LLMs
obtain context, execute actions, and interact with various systems.

## How does MCP work?

MCP follows a client-server architecture, defining how data (resources),
interactive templates (prompts), and actionable functions (tools) are
exposed by an MCP server and consumed by an MCP client (which could be
an LLM host application or an AI agent).

## MCP Tools in ADK

ADK helps you both use and consume MCP tools in your agents, whether you're
trying to build a tool to call an MCP service, or exposing an MCP server for
other developers or agents to interact with your tools.

Refer to the [MCP Tools documentation](/adk-docs/tools-custom/mcp-tools/) for code samples
and design patterns that help you use ADK together with MCP servers, including:

- **Using Existing MCP Servers within ADK**: An ADK agent can act as an MCP
  client and use tools provided by external MCP servers.
- **Exposing ADK Tools via an MCP Server**: How to build an MCP server that
  wraps ADK tools, making them accessible to any MCP client.

## MCP Toolbox for Databases

[MCP Toolbox for Databases](https://github.com/googleapis/genai-toolbox) is an
open-source MCP server that securely exposes your backend data sources as a
set of pre-built, production-ready tools for Gen AI agents. It functions as a
universal abstraction layer, allowing your ADK agent to securely query, analyze,
and retrieve information from a wide array of databases with built-in support.

The MCP Toolbox server includes a comprehensive library of connectors, ensuring that
agents can safely interact with your complex data estate.

### Supported Data Sources

MCP Toolbox provides out-of-the-box toolsets for the following databases and data platforms:

#### Google Cloud

*   [BigQuery](https://googleapis.github.io/genai-toolbox/resources/sources/bigquery/) (including tools for SQL execution, schema discovery, and AI-powered time series forecasting)
*   [AlloyDB](https://googleapis.github.io/genai-toolbox/resources/sources/alloydb-pg/) (PostgreSQL-compatible, with tools for both standard queries and natural language queries)
*   [AlloyDB Admin](https://googleapis.github.io/genai-toolbox/resources/sources/alloydb-admin/)
*   [Spanner](https://googleapis.github.io/genai-toolbox/resources/sources/spanner/) (supporting both GoogleSQL and PostgreSQL dialects)
*   Cloud SQL (with dedicated support for [Cloud SQL for PostgreSQL](https://googleapis.github.io/genai-toolbox/resources/sources/cloud-sql-pg/), [Cloud SQL for MySQL](https://googleapis.github.io/genai-toolbox/resources/sources/cloud-sql-mysql/), and [Cloud SQL for SQL Server](https://googleapis.github.io/genai-toolbox/resources/sources/cloud-sql-mssql/))
*   [Cloud SQL Admin](https://googleapis.github.io/genai-toolbox/resources/sources/cloud-sql-admin/)
*   [Firestore](https://googleapis.github.io/genai-toolbox/resources/sources/firestore/)
*   [Bigtable](https://googleapis.github.io/genai-toolbox/resources/sources/bigtable/)
*   [Dataplex](https://googleapis.github.io/genai-toolbox/resources/sources/dataplex/) (for data discovery and metadata search)
*   [Cloud Monitoring](https://googleapis.github.io/genai-toolbox/resources/sources/cloud-monitoring/)

#### Relational & SQL Databases

*   [PostgreSQL](https://googleapis.github.io/genai-toolbox/resources/sources/postgres/) (generic)
*   [MySQL](https://googleapis.github.io/genai-toolbox/resources/sources/mysql/) (generic)
*   [Microsoft SQL Server](https://googleapis.github.io/genai-toolbox/resources/sources/mssql/) (generic)
*   [ClickHouse](https://googleapis.github.io/genai-toolbox/resources/sources/clickhouse/)
*   [TiDB](https://googleapis.github.io/genai-toolbox/resources/sources/tidb/)
*   [OceanBase](https://googleapis.github.io/genai-toolbox/resources/sources/oceanbase/)
*   [Firebird](https://googleapis.github.io/genai-toolbox/resources/sources/firebird/)
*   [SQLite](https://googleapis.github.io/genai-toolbox/resources/sources/sqlite/)
*   [YugabyteDB](https://googleapis.github.io/genai-toolbox/resources/sources/yugabytedb/)

#### NoSQL & Key-Value Stores

*   [MongoDB](https://googleapis.github.io/genai-toolbox/resources/sources/mongodb/)
*   [Couchbase](https://googleapis.github.io/genai-toolbox/resources/sources/couchbase/)
*   [Redis](https://googleapis.github.io/genai-toolbox/resources/sources/redis/)
*   [Valkey](https://googleapis.github.io/genai-toolbox/resources/sources/valkey/)
*   [Cassandra](https://googleapis.github.io/genai-toolbox/resources/sources/cassandra/)

#### Graph Databases

*   [Neo4j](https://googleapis.github.io/genai-toolbox/resources/sources/neo4j/) (with tools for Cypher queries and schema inspection)
*   [Dgraph](https://googleapis.github.io/genai-toolbox/resources/sources/dgraph/)

#### Data Platforms & Federation

*   [Looker](https://googleapis.github.io/genai-toolbox/resources/sources/looker/) (for running Looks, queries, and building dashboards via the Looker API)
*   [Trino](https://googleapis.github.io/genai-toolbox/resources/sources/trino/) (for running federated queries across multiple sources)

#### Other

*   [HTTP](https://googleapis.github.io/genai-toolbox/resources/sources/http/)

### Documentation

Refer to the
[MCP Toolbox for Databases](/adk-docs/tools/google-cloud/mcp-toolbox-for-databases/)
documentation on how you can use ADK together with the MCP Toolbox for
Databases. For getting started with the MCP Toolbox for Databases, a blog post [Tutorial : MCP Toolbox for Databases - Exposing Big Query Datasets](https://medium.com/google-cloud/tutorial-mcp-toolbox-for-databases-exposing-big-query-datasets-9321f0064f4e) and Codelab [MCP Toolbox for Databases:Making BigQuery datasets available to MCP clients](https://codelabs.developers.google.com/mcp-toolbox-bigquery-dataset?hl=en#0) are also available.

![GenAI Toolbox](../assets/mcp_db_toolbox.png)

## ADK Agent and FastMCP server
[FastMCP](https://github.com/jlowin/fastmcp) handles all the complex MCP protocol details and server management, so you can focus on building great tools. It's designed to be high-level and Pythonic; in most cases, decorating a function is all you need.

Refer to the [MCP Tools documentation](/adk-docs/tools-custom/mcp-tools/) documentation on
how you can use ADK together with the FastMCP server running on Cloud Run.

## MCP Servers for Google Cloud Genmedia

[MCP Tools for Genmedia Services](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
is a set of open-source MCP servers that enable you to integrate Google Cloud
generative media services—such as Imagen, Veo, Chirp 3 HD voices, and Lyria—into
your AI applications.

Agent Development Kit (ADK) and [Genkit](https://genkit.dev/) provide built-in
support for these MCP tools, allowing your AI agents to effectively orchestrate
generative media workflows. For implementation guidance, refer to the [ADK
example
agent](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia/sample-agents/adk)
and the
[Genkit example](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia/sample-agents/genkit).