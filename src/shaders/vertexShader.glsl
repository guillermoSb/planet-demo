
uniform float uMinHeight;
uniform float uMaxHeight;
varying float vInterpolatedHeight;

void main() {
	vec4 modelPosition = modelMatrix * vec4(position, 1.0);	
	float height = length(modelPosition.xyz);
	float interpolatedHeight = smoothstep(uMinHeight, uMaxHeight, height);
	vec4 viewPosition = viewMatrix * modelPosition;
	vec4 projectedPosition = projectionMatrix * viewPosition;
	gl_Position = projectedPosition;
	
	
	vInterpolatedHeight = interpolatedHeight;
}