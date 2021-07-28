const chalk = require('chalk');
const execa = require('execa');
const { prompt } = require('enquirer');

const versionRegex = /^\d+\.\d+\.\d+$/;
const step = msg => console.log(chalk.bgYellowBright(chalk.black(msg)));
const success = msg => console.log(chalk.bgGreenBright(chalk.black(msg)));
const error = msg => console.log(chalk.bgRedBright(chalk.black(msg)));

const run = (bin, args, opts = {}) =>
  execa(bin, args, {
    stdio: `pipe`,
    ...opts,
  });

const getGitBranch = () => {
  const res = execa.commandSync('git rev-parse --abbrev-ref HEAD');
  return res.stdout;
};

async function main() {
  const currentBranch = getGitBranch();

  step(`添加 git 追踪`);
  await run(`git`, [`add`, `.`]);
  // await run(`git-cz`);
  await run(`git`, [`commit`, `-m`, `111`]);
  await run(`git`, [`push`]); //
  // 切换到 dev 分支并拉取最新代码
  step(`切换到 dev 分支并拉取最新代码`);
  await run(`git`, [`checkout`, `dev`]);
  await run(`git`, [`pull`, `origin`, `dev`]);

  // TODO: 处理发生冲突的情况

  // 合并提交分支
  await run(`git`, [`merge`, currentBranch]);

  // 推送dev
  step(`合并到 dev 分支完成，推送到远端`);
  await run(`git`, [`push`]);

  success(`推送 dev 完成，稍后 Jenkins 将启动构建并通知`);

  step(`切换回到 ${currentBranch} 分支`);
  await run(`git`, [`checkout`, currentBranch]);

  success(`发布测试环境完成`);
  return;
}

main().catch(err => {
  error(err);
});
