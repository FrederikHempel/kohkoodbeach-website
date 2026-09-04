import AVFoundation
import AppKit

let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1])
let outDir = args[2]
let times = args[3...].compactMap { Double($0) }

let asset = AVURLAsset(url: url)
let track = asset.tracks(withMediaType: .video).first!
let size = track.naturalSize.applying(track.preferredTransform)
print("duration \(CMTimeGetSeconds(asset.duration))s  size \(abs(size.width))x\(abs(size.height))  fps \(track.nominalFrameRate)")

let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero      // exact frame, no nearest-keyframe drift
gen.requestedTimeToleranceAfter = .zero

for t in times {
    let cm = CMTime(seconds: t, preferredTimescale: 600)
    do {
        let cg = try gen.copyCGImage(at: cm, actualTime: nil)
        let rep = NSBitmapImageRep(cgImage: cg)
        rep.size = NSSize(width: cg.width, height: cg.height)
        let png = rep.representation(using: .png, properties: [:])!
        let path = "\(outDir)/frame_\(String(format: "%.1f", t)).png"
        try png.write(to: URL(fileURLWithPath: path))
        print("wrote \(path)  \(cg.width)x\(cg.height)")
    } catch { print("FAILED at \(t)s: \(error)") }
}
