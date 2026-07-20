// @vitest-environment jsdom
/**
 * @file file-upload.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for the `<FileUpload>` compound — the
 *   drag-and-drop upload zone with an accompanying thumbnail preview grid.
 *   Covers smoke render of drop zone, label/description, `onFilesAdded`
 *   callback firing on file input change and on drop, MIME / size / count
 *   validation, and the `.Preview` grid rendering + remove wiring.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileUpload } from "@/react/components/file-upload/file-upload.component";
import type { UploadFile } from "@/react/components/file-upload/file-upload.interface";

afterEach(cleanup);

/** Build a fake `File` with the given name / size / type. */
function makeFile(name: string, type: string, size = 1024): File {
  const file = new File(["0".repeat(size)], name, { type });
  // jsdom's `File` constructor honours `.size` from the body; we don't need
  // to override it. But we assert the shape here to fail early if that ever
  // changes.
  Object.defineProperty(file, "size", { value: size, configurable: true });

  return file;
}

/** Build an `UploadFile` fixture. */
function upload(overrides: Partial<UploadFile>): UploadFile {
  return {
    id: overrides.id ?? "f1",
    name: overrides.name ?? "photo.png",
    size: overrides.size ?? 1024,
    type: overrides.type ?? "image/png",
    status: overrides.status ?? "idle",
    progress: overrides.progress,
    previewUrl: overrides.previewUrl,
    error: overrides.error,
  };
}

describe("<FileUpload>", () => {
  it("renders the default label", () => {
    render(<FileUpload />);
    expect(screen.getByText("Drop files here or click to upload")).toBeDefined();
  });

  it("renders a custom label + description", () => {
    render(<FileUpload description="PNG or JPG, up to 5 MB" label="Attach images" />);
    expect(screen.getByText("Attach images")).toBeDefined();
    expect(screen.getByText("PNG or JPG, up to 5 MB")).toBeDefined();
  });

  it('stamps data-component="file-upload" on the drop zone', () => {
    const { container } = render(<FileUpload />);
    expect(container.querySelector('[data-component="file-upload"]')).not.toBeNull();
  });

  it("forwards `className` onto the drop zone", () => {
    const { container } = render(<FileUpload className="my-drop" />);
    const zone = container.querySelector('[data-component="file-upload"]');
    expect(zone?.className.includes("my-drop")).toBe(true);
  });

  it("renders the caller-supplied children instead of the default label when provided", () => {
    render(
      <FileUpload>
        <span data-testid="custom-inner">custom body</span>
      </FileUpload>,
    );
    expect(screen.getByTestId("custom-inner")).toBeDefined();
    expect(screen.queryByText("Drop files here or click to upload")).toBeNull();
  });

  it("fires onFilesAdded when files are picked via the input element", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<FileUpload onFilesAdded={onFilesAdded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("cat.png", "image/png");

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledOnce();
    expect(onFilesAdded.mock.calls[0]?.[0]).toHaveLength(1);
    expect(onFilesAdded.mock.calls[0]?.[0][0].name).toBe("cat.png");
  });

  it("filters files by the `accept` MIME patterns", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<FileUpload accept={["image/*"]} onFilesAdded={onFilesAdded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const png = makeFile("cat.png", "image/png");
    const pdf = makeFile("doc.pdf", "application/pdf");

    fireEvent.change(input, { target: { files: [png, pdf] } });

    expect(onFilesAdded).toHaveBeenCalledOnce();
    const forwarded = onFilesAdded.mock.calls[0]?.[0] as File[];
    expect(forwarded.map((f) => f.name)).toEqual(["cat.png"]);
  });

  it("enforces `maxFiles` by slicing the picked list", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<FileUpload maxFiles={2} onFilesAdded={onFilesAdded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      makeFile("a.png", "image/png"),
      makeFile("b.png", "image/png"),
      makeFile("c.png", "image/png"),
    ];

    fireEvent.change(input, { target: { files } });

    expect((onFilesAdded.mock.calls[0]?.[0] as File[]).length).toBe(2);
  });

  it("filters out files that exceed `maxFileSize`", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<FileUpload maxFileSize={2048} onFilesAdded={onFilesAdded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const small = makeFile("a.png", "image/png", 1024);
    const large = makeFile("b.png", "image/png", 4096);

    fireEvent.change(input, { target: { files: [small, large] } });

    const passed = onFilesAdded.mock.calls[0]?.[0] as File[];
    expect(passed.map((f) => f.name)).toEqual(["a.png"]);
  });

  it("does not fire onFilesAdded when disabled", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<FileUpload isDisabled onFilesAdded={onFilesAdded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("a.png", "image/png")] } });
    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it("fires onFilesAdded on drop", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<FileUpload onFilesAdded={onFilesAdded} />);
    const zone = container.querySelector('[data-component="file-upload"]') as HTMLElement;
    const file = makeFile("drop.png", "image/png");

    act(() => {
      fireEvent.drop(zone, {
        dataTransfer: { files: [file] },
      });
    });

    expect(onFilesAdded).toHaveBeenCalledOnce();
    expect((onFilesAdded.mock.calls[0]?.[0] as File[])[0].name).toBe("drop.png");
  });
});

describe("<FileUpload.Preview>", () => {
  it("renders a thumbnail for each file", () => {
    const files = [upload({ id: "a", name: "a.png" }), upload({ id: "b", name: "b.png" })];
    render(<FileUpload.Preview files={files} />);
    expect(screen.getByText("a.png")).toBeDefined();
    expect(screen.getByText("b.png")).toBeDefined();
  });

  it("returns null when the file list is empty", () => {
    const { container } = render(<FileUpload.Preview files={[]} />);
    expect(container.querySelector('[data-component="file-upload-preview"]')).toBeNull();
  });

  it("renders a remove button and fires onRemove with the file id", () => {
    const onRemove = vi.fn();
    render(<FileUpload.Preview files={[upload({ id: "x", name: "x.png" })]} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove x.png" }));
    expect(onRemove).toHaveBeenCalledWith("x");
  });

  it("does not render remove buttons when onRemove is not supplied", () => {
    render(<FileUpload.Preview files={[upload({ id: "x", name: "x.png" })]} />);
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
  });

  it("renders an <img> for image files with a previewUrl", () => {
    render(
      <FileUpload.Preview
        files={[upload({ id: "img", name: "img.png", previewUrl: "blob:preview" })]}
      />,
    );
    const img = screen.getByRole("img", { name: "img.png" }) as HTMLImageElement;
    expect(img.src).toContain("blob:preview");
  });
});
