import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { usePwaInstall, isPwaBannerDismissed, dismissPwaBanner } from "@/lib/pwa/usePwaInstall";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { PwaInstallDialog } from "@/components/pwa/PwaInstallDialog";
import type { PwaInstallState } from "@/lib/pwa/usePwaInstall";

describe("PWA Cross-Platform Installation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("handles dismissal persistence in localStorage", () => {
    expect(isPwaBannerDismissed()).toBe(false);
    dismissPwaBanner();
    expect(isPwaBannerDismissed()).toBe(true);
  });

  it("renders PWA banner when app is not standalone and installable", () => {
    const mockPwa: PwaInstallState = {
      isStandalone: false,
      isIos: false,
      isAndroid: false,
      isSafari: false,
      isInstallable: true,
      hasPrompt: true,
      promptInstall: vi.fn(),
    };

    const onOpen = vi.fn();
    render(<PwaInstallBanner pwa={mockPwa} onOpenInstallDialog={onOpen} />);

    expect(screen.getByText("Install Divido App")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
  });

  it("hides PWA banner when app is running in standalone mode", () => {
    const mockPwa: PwaInstallState = {
      isStandalone: true,
      isIos: false,
      isAndroid: false,
      isSafari: false,
      isInstallable: false,
      hasPrompt: false,
      promptInstall: vi.fn(),
    };

    const { container } = render(<PwaInstallBanner pwa={mockPwa} onOpenInstallDialog={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders iOS step-by-step instructions in PwaInstallDialog on iOS", () => {
    const mockPwa: PwaInstallState = {
      isStandalone: false,
      isIos: true,
      isAndroid: false,
      isSafari: true,
      isInstallable: true,
      hasPrompt: false,
      promptInstall: vi.fn().mockResolvedValue("show-ios-guide"),
    };

    render(<PwaInstallDialog open={true} onClose={vi.fn()} pwa={mockPwa} />);

    expect(screen.getByText("Install Divido on iPhone")).toBeInTheDocument();
    expect(screen.getByText(/1\. Tap Share/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Add to Home Screen/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Tap Add/i)).toBeInTheDocument();
  });

  it("renders native install button in PwaInstallDialog when browser beforeinstallprompt is available", async () => {
    const mockPrompt = vi.fn().mockResolvedValue("accepted");
    const mockPwa: PwaInstallState = {
      isStandalone: false,
      isIos: false,
      isAndroid: true,
      isSafari: false,
      isInstallable: true,
      hasPrompt: true,
      promptInstall: mockPrompt,
    };

    const onClose = vi.fn();
    render(<PwaInstallDialog open={true} onClose={onClose} pwa={mockPwa} />);

    expect(screen.getByText("Install Divido App")).toBeInTheDocument();
    const installBtn = screen.getByRole("button", { name: /install now/i });
    expect(installBtn).toBeInTheDocument();

    fireEvent.click(installBtn);
    expect(mockPrompt).toHaveBeenCalled();
  });
});
