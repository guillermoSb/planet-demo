
varying float vInterpolatedHeight;

uniform sampler2D uTexture;

void main() {
	vec4 textureColor = texture2D(uTexture, vec2(vInterpolatedHeight,0.0));
	gl_FragColor = textureColor;
}