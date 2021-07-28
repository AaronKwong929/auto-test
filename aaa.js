const chalk = require('chalk');
chalk.level = 3;
const execa = require('execa');
const { prompt } = require('enquirer');

const versionRegex = /^\d+\.\d+\.\d+$/;
const step = msg => console.log(chalk.bgYellowBright(chalk.black(msg)));
// const success = msg => console.log(chalk.bgGreenBright(chalk.black(msg)));
const success = msg => console.log(`\x1B[102m\x1B[30m${msg}\x1B[39m\x1B[49m`);
const error = msg => console.log(chalk.bgRedBright(chalk.black(msg)));

const run = (bin, args, opts = {}) =>
  execa(bin, args, {
    stdio: `inherit`,
    ...opts,
  });

const getGitBranch = () => {
  const res = execa.commandSync('git rev-parse --abbrev-ref HEAD');
  return res.stdout;
};

async function main() {
  const currentBranch = getGitBranch();

  success(`添加 git 追踪`);
  await run(`git`, [`add`, `.`]);
  await run(`git-cz`);
  // await run(`git`, [`commit`, `-m`, `111`]);
  await run(`git`, [`push`]); //
  // 切换到 dev 分支并拉取最新代码
  success(`切换到 dev 分支并拉取最新代码`);
  await run(`git`, [`checkout`, `dev`]);
  await run(`git`, [`pull`, `origin`, `dev`]);

  // TODO: 处理发生冲突的情况

  // 合并提交分支
  await run(`git`, [`merge`, currentBranch]);

  // 推送dev
  success(`合并到 dev 分支完成，推送到远端`);
  await run(`git`, [`push`]);

  success(`\n推送 dev 完成，稍后 Jenkins 将启动构建并通知`);

  success(`切换回到 ${currentBranch} 分支`);
  await run(`git`, [`checkout`, currentBranch]);

  success(`\n发布测试环境完成`);
  return;
}

main().catch(err => {
  error(err);
});
